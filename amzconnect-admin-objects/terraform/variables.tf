variable "instance_alias" {
  type        = string
  description = "The name of the Amazon Connect instance"
  default     = null
}

variable "env" {
  type        = string
  description = "The name of the SDLC environment"
  default     = null
}

variable "region" {
  type        = string
  description = "The AWS region to deploy the instance"
  default     = null
}

variable "region_shortname" {
  type        = string
  description = "The AWS region to deploy the instance"
  default     = null
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


