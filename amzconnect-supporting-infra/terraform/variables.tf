variable "deploy_role_arn" {
  type    = string
  default = null
}

variable "env" {
  type    = string
  default = "dev"
}

variable "app" {
  type    = string
  default = "ACME"
}

variable "account" {
  type    = string
  default = "251778280686"
}

variable "bucket" {
  type    = string
  default = "callflow-bucket-dev-us-east-1-1689174870695"
}

variable "repo" {
  type        = string
  description = "The name of the repository hosting the code for this deployment"
  default     = null
}

variable "capability_id" {
  type        = string
  description = "The name of the capability descriptor for the microservice"
  default     = null
}

variable "ivr_id" {
  type        = string
  description = "The name of the functional alias prefix descriptor for the instance"
  default     = null
}

variable "lexbot_name" {
  type        = string
  description = "Lex bot name for this resource"
}

variable "region" {
  type        = string
  description = "AWS region: us-east-1, us-west-2. Used to build resource name."
}

variable "region_shortname" {
  type        = map(string)
  description = "AWS region shortnames. Do not override."
  default = {
    us-east-1 = "use1"
    us-west-2 = "usw2"
  }
}

# variable "data_privacy" {
#   description = "Data privacy setting of the Bot"
#   type = object({
#     child_directed = bool
#   })
# }

variable "idle_session_ttl_in_seconds" {
  description = "IdleSessionTTLInSeconds of the resource"
  type        = number
}

# variable "lex_role_arn" {
#   description = "The Amazon Resource Name (ARN) of an IAM role that has permission to access the bot."
#   type        = string
# }

variable "auto_build_bot_locales" {
  description = "Specifies whether to build the bot locales after bot creation completes."
  type        = bool
  default     = true
}

variable "bot_file_s3_location" {
  description = "S3 location of bot definitions zip file, if it's not defined locally"
  type = object({
    s3_bucket         = string
    s3_object_key     = string
    s3_object_version = string
  })
  default = null
}

variable "lexbot_description" {
  description = "Lex Bot Description"
  type        = string
  default     = ""
}

variable "s3_obj_version_id" {
  type        = string
  description = "Version id for lex bot s3 asset. Used to force redeploy via lifecycle policy"
  default     = "default"
}

