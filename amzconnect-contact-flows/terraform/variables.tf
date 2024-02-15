variable "region" {
  type = string
}


variable "env" {
  type    = string
  default = "dev"
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





