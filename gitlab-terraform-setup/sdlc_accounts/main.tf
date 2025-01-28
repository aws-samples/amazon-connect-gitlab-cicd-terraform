terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 4.26"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

data "aws_iam_policy_document" "assume-role-policy" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "AWS"
      identifiers = var.devops_role_arn
    }
  }

}

resource "aws_iam_policy" "power_user_policy" {
  # This role is a deployment role based on a power user policy. It can be restricted further depending on needs
  # checkov:skip=CKV_AWS_288: "Ensure IAM policies does not allow data exfiltration"
  # checkov:skip=CKV_AWS_289: "Ensure IAM policies does not allow permissions management"
  # checkov:skip=CKV_AWS_286: "Ensure IAM policies does not allow privilege escalation"
  # checkov:skip=CKV_AWS_355: "Ensure no IAM policies documents allow "*" as a statement's resource for restrictable actions"
  # checkov:skip=CKV_AWS_287: "Ensure IAM policies does not allow credentials exposure"
  # checkov:skip=CKV_AWS_290: "Ensure IAM policies does not allow write access without constraints"
  name = "power-user-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        NotAction = [
          "iam:*",
          "organizations:*",
          "account:*"
        ]
        Effect   = "Allow"
        Resource = "*"
      },
      {
        Action = [
          "iam:GetPolicyVersion",
          "iam:UpdateAssumeRolePolicy",
          "iam:ListRoleTags",
          "iam:DeletePolicy",
          "iam:CreateRole",
          "iam:AttachRolePolicy",
          "iam:PutRolePolicy",
          "iam:PassRole",
          "iam:DetachRolePolicy",
          "iam:DeleteRolePolicy",
          "iam:ListAttachedRolePolicies",
          "iam:ListPolicyTags",
          "iam:CreatePolicyVersion",
          "iam:ListRolePolicies",
          "iam:GetRole",
          "iam:GetPolicy",
          "iam:ListEntitiesForPolicy",
          "iam:UpdateRoleDescription",
          "iam:ListRoles",
          "iam:DeleteRole",
          "iam:TagPolicy",
          "iam:TagRole",
          "iam:UntagRole",
          "iam:CreatePolicy",
          "iam:ListPolicyVersions",
          "iam:UntagPolicy",
          "iam:UpdateRole",
          "iam:GetRolePolicy",
          "iam:DeletePolicyVersion",
          "iam:SetDefaultPolicyVersion",
          "iam:ListInstanceProfilesForRole",
          "organizations:DescribeOrganization",
          "account:ListRegions"
        ]
        Effect   = "Allow"
        Resource = "*"
      },
      {
        Action = [
          "iam:CreateServiceLinkedRole"
        ]
        Effect   = "Allow"
        Resource = "arn:aws:iam::*:role/aws-service-role/connect.amazonaws.com/*"
      }
    ]
  })
}

resource "aws_iam_role" "gitlab_ci" {
  name                = "GitLabCI_WorkshopDeploymentRole"
  assume_role_policy  = data.aws_iam_policy_document.assume-role-policy.json
  managed_policy_arns = [aws_iam_policy.power_user_policy.arn]

}

output "ROLE_ARN" {
  description = "Role that needs to be assumed by GitLab CI. We will use this as a GitLab CI Variable"
  value       = aws_iam_role.gitlab_ci.arn
}
