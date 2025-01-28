variable "env" {
  type        = string
  description = "The name of the SDLC environment"
  default     = "dev"
}

variable "repo" {
  type        = string
  description = "The name of the repository hosting the code for this deployment"
  default     = null
}

variable "ivr_id" {
  type        = string
  description = "The name of the functional alias descriptor for the instance"
  default     = null
}

variable "capability_id" {
  type        = string
  description = "The name of the capability descriptor for the microservice"
  default     = null
}

variable "lexbot_name" {
  type        = string
  description = "Lex bot name for this resource"
}

variable "lexbot_alias" {
  type        = string
  description = "Lex bot name for this resource"
}

variable "source_bot_version" {
  type        = string
  description = "source lex bot version number to base new version upon"
  default     = "DRAFT"
}

variable "region" {
  type        = string
  description = "AWS region: us-east-1, us-west-2. Used to build resource name."
  default     = "us-west-2"
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


