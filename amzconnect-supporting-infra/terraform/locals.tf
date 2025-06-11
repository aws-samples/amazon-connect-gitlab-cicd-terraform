locals {
  aws_region     = data.aws_region.current.name
  aws_account_id = data.aws_caller_identity.current.account_id
  instance_arn   = "arn:aws:connect:${local.aws_region}:${local.aws_account_id}:instance/${data.aws_ssm_parameter.amz-connect-instance-id.value}"
  region_shortnames = {
    us-east-1 = "use1"
    us-west-2 = "usw2"
  }

  bots_state_root_dir = "${path.module}/../../imports/resources/bots"

  # Get all files recursively
  all_files = try(fileset(local.bots_state_root_dir, "**"), [])
  # Extract unique top-level directory names (bot directories)
  bot_state_dir_names = try(
    toset(distinct([for k in local.all_files : split("/", k)[0]])),
    null
  )

  # Use the extracted directory names as bot_dirs
  bot_dirs = local.bot_state_dir_names

  # Bot configs - read from Manifest.json if it exists
  bot_configs = {
    for bot_dir in local.bot_dirs : bot_dir => {
      name = try(
        fileexists("${local.bots_state_root_dir}/${bot_dir}/Manifest.json") ?
        jsondecode(file("${local.bots_state_root_dir}/${bot_dir}/Manifest.json")).name :
        bot_dir,
        bot_dir
      )
      idleSessionTTLInSeconds = try(
        fileexists("${local.bots_state_root_dir}/${bot_dir}/Manifest.json") ?
        jsondecode(file("${local.bots_state_root_dir}/${bot_dir}/Manifest.json")).idleSessionTTLInSeconds :
        var.idle_session_ttl_in_seconds,
        var.idle_session_ttl_in_seconds
      )
    }
  }

  # Bot locales - get directories from BotLocales containing BotLocale.json
  bot_locales = {
    for bot_dir in local.bot_dirs : bot_dir => try(
      # Use a specific pattern to find all BotLocale.json files
      length(fileset("${local.bots_state_root_dir}/${bot_dir}/${bot_dir}/BotLocales", "*/BotLocale.json")) > 0 ?

      # Extract just the locale directory names from the paths
      [
        for file_path in fileset("${local.bots_state_root_dir}/${bot_dir}/${bot_dir}/BotLocales", "*/BotLocale.json") :
        replace(file_path, "/BotLocale.json", "")
      ] :

      ["en_US"],
      ["en_US"]
    )
  }
  # Create a map of bot configurations with all necessary properties
  bots = {
    for bot_dir in local.bot_dirs : bot_dir => {
      name             = local.bot_configs[bot_dir].name
      idle_session_ttl = local.bot_configs[bot_dir].idleSessionTTLInSeconds
      locales          = local.bot_locales[bot_dir]
      base_name        = "${var.env}-${local.region_shortnames[var.region]}-lex-${bot_dir}"
    }
  }

  # Bot aliases - get alias file
  bot_aliases = {
    for bot_dir in local.bot_dirs : bot_dir => try(
      # First, try to read the file regardless of whether fileexists() thinks it's there
      jsondecode(try(
        file("${local.bots_state_root_dir}/${bot_dir}/aliases.json"),
        "{}" # Default to empty JSON if file() fails
      )),
      {} # Default to empty map if jsondecode() fails
    )
  }

  # Create a map of bot -> language -> lambda ARN
  get_lambda_codehooks_by_locale = {
    for bot_dir in local.bot_dirs : bot_dir => (
      # Check if this bot has aliases defined
      can(local.bot_aliases[bot_dir]) && length(local.bot_aliases[bot_dir]) > 0 ?
      # Find the PROD alias
      (
        try(
          # Try to get the PROD alias's locale settings
          {
            for locale, settings in(
              [for alias in local.bot_aliases[bot_dir] :
              alias.botAliasLocaleSettings if alias.botAliasName == "current"][0]
              # Take first PROD alias found (should be only one)
              ) : locale => try(
              replace(replace(settings.codeHookSpecification.lambdaCodeHook.lambdaARN, "$${REGION}", local.aws_region), "$${ACCT_ID}", local.aws_account_id),
              null
            ) if try(settings.enabled, false) &&
            try(settings.codeHookSpecification.lambdaCodeHook.lambdaARN, null) != null
          },
          # If no PROD alias, return empty map
          {}
        )
      )
      : # No aliases defined, return empty map
      {}
    )
  }
}
