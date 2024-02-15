terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 4.26"
    }
    tls = {
      source  = "hashicorp/tls"
      version = ">= 4.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

data "tls_certificate" "gitlab" {
  url = var.gitlab_tls_url
}

resource "aws_iam_openid_connect_provider" "gitlab" {
  url             = var.gitlab_url
  client_id_list  = [var.aud_value]
  thumbprint_list = [data.tls_certificate.gitlab.certificates[0].sha1_fingerprint]
}

data "aws_iam_policy_document" "assume-role-policy" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.gitlab.arn]
    }
    condition {
      test     = "ForAnyValue:StringLike"
      variable = "${aws_iam_openid_connect_provider.gitlab.url}:${var.match_field}"
      values   = [var.aud_value]
    }

    condition {
      test     = "ForAnyValue:StringLike"
      variable = "${aws_iam_openid_connect_provider.gitlab.url}:sub"
      values   = ["project_path:${var.repo_value}:ref_type:branch:ref:develop"]
    }

    condition {
      test     = "ForAnyValue:StringLike"
      variable = "${aws_iam_openid_connect_provider.gitlab.url}:sub"
      values   = ["project_path:${var.repo_value}:ref_type:branch:ref:main"]
    }

    condition {
      test     = "ForAnyValue:StringLike"
      variable = "${aws_iam_openid_connect_provider.gitlab.url}:sub"
      values   = ["project_path:${var.repo_value}:ref_type:branch:ref:stage"]
    }
  }

}

resource "aws_iam_policy" "sts_policy" {
  name = "sts-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action   = ["sts:AssumeRole"]
        Effect   = "Allow"
        Resource = var.sdlc_roles
      },
    ]
  })
}

resource "aws_iam_role" "gitlab_ci" {
  name_prefix         = "GitLabCI"
  assume_role_policy  = data.aws_iam_policy_document.assume-role-policy.json
  managed_policy_arns = [aws_iam_policy.sts_policy.arn]
}

output "ROLE_ARN" {
  description = "Role that needs to be assumed by GitLab CI. We will use this as a GitLab CI Variable"
  value       = aws_iam_role.gitlab_ci.arn
}
