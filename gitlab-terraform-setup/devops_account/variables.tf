
variable "aws_region" {
  type = string
}

variable "gitlab_tls_url" {
  type = string
  # Avoid using https scheme because the Hashicorp TLS provider has started following redirects starting v4.
  # See https://github.com/hashicorp/terraform-provider-tls/issues/249
  default = "tls://gitlab.com:443"
}

variable "gitlab_url" {
  type    = string
  default = "https://gitlab.com"
}

variable "aud_value" {
  type    = string
  default = "https://gitlab.example.com"
}

variable "repo_value" {
  type    = string
  description = "The value of the Gitlab ID and repo. Ex. myname/myrepo"
  default = ""
}


variable "match_field" {
  type    = string
  default = ""
}

# variable "match_value" {
#   type = list(any)
# }

variable "sdlc_roles" {
  type = list(any)
}
