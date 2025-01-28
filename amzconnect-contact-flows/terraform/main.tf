locals {
  filepath    = "../../imports/resources/flows"   ## ../contact_flows
  contentpath = "../imports/contact_flow_content" ##../contact_flow_content"
  files       = fileset(local.filepath, "**")
  allfiles    = { for flow in local.files : flow => jsondecode(file("${local.filepath}/${flow}")) }

  contact_flow_modules      = { for k, v in local.allfiles : k => v if !can(v["Type"]) }
  contact_flows             = { for k, v in local.allfiles : k => v if can(v["Type"]) }
  contact_flow_module_names = [for k, v in local.contact_flow_modules : v.Name]
  contact_flow_names        = [for k, v in local.contact_flows : v.Name]
}


resource "aws_connect_contact_flow" "contact_flows" {
  for_each = local.contact_flows

  instance_id  = data.aws_ssm_parameter.amz-connect-instance-id.value
  name         = each.value["Name"]
  description  = try(each.value["Description"], "Provisioned via Terraform")
  type         = each.value["Type"]
  filename     = "${local.contentpath}/${each.key}"
  content_hash = filebase64sha256("${local.contentpath}/${each.key}")

  lifecycle {
    ignore_changes = [tags]
  }
}

resource "aws_connect_contact_flow_module" "this" {
  for_each = local.contact_flow_modules

  instance_id = data.aws_ssm_parameter.amz-connect-instance-id.value
  name        = each.value["Name"]
  description = try(each.value["Description"], "Provisioned via Terraform")
  # content      = each.value["Content"]
  filename     = "${local.contentpath}/${each.key}"
  content_hash = filebase64sha256("${local.contentpath}/${each.key}")

  lifecycle {
    ignore_changes = [tags]
  }
}



