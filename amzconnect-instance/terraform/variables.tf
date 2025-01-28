variable "env" {
  type        = string
  description = "The name of the SDLC environment"
  default     = "dev"
}

variable "region" {
  type        = string
  description = "The AWS region to deploy the instance"
  default     = "us-east-1"
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

