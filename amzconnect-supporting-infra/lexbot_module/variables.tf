variable "lexbot_complete_name" {
  type        = string
  description = "Lex bot name for this resource"
}

variable "lexbot_alias" {
  type        = string
  description = "Lex bot name for this resource"
}


variable "idle_session_ttl_in_seconds" {
  description = "IdleSessionTTLInSeconds of the resource"
  type        = number
}


variable "auto_build_bot_locales" {
  description = "Specifies whether to build the bot locales after bot creation completes."
  type        = bool
  default     = true
}

variable "lexbot_description" {
  description = "Lex Bot Description"
  type        = string
  default     = ""
}

variable "lexbot_iam_base_name" {
  description = "Lex Bot IAM base name"
  type        = string
  default     = ""
}

variable "audio_log_bucket" {
  description = "S3 bucket to store audio logs"
  type        = string
  default     = ""
}

variable "s3_obj_version_id" {
  description = "new version of the s3 object triggers lex bot deployment"
  type        = string
  default     = ""
}

variable "s3_bucket" {
  description = "location of s3 bucket where lexbot artifact is stored"
  type        = string
  default     = ""
}

variable "s3_object_key" {
  description = "S3 key of lexbot artifact"
  type        = string
  default     = ""
}

variable "instance_arn" {
  description = "Connect instance arn (used to attach lexbot)"
  type        = string
  default     = ""
}

variable "source_bot_version" {
  type        = string
  description = "source lex bot version number to base new version upon"
  default     = "DRAFT"
}

