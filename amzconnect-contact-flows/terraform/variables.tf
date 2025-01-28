variable "region" {
  description = "AWS region to deploy into"
  type        = string
}


variable "env" {
  description = "The environment name for this deployment"
  type        = string
  default     = "dev"
}


variable "repo" {
  type        = string
  description = "The name of the repository hosting the code for this deployment"
  default     = null
}

variable "ivr_id" {
  type        = string
  description = "The name of the functional alias prefix descriptor for the instance"
  default     = null
}







