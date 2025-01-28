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

variable "qc_option" {
  description = "variable determining whether quick connects will be added to a queue or not"
  type        = bool
  default     = false
}
