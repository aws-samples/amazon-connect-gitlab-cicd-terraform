data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

data "aws_iam_policy_document" "lex_assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole", "sts:TagSession"]

    principals {
      type        = "Service"
      identifiers = ["lexv2.amazonaws.com"]
    }
  }
}

data "aws_iam_policy_document" "lex_policies" {
  statement {
    sid     = "lexPolicies"
    effect  = "Allow"
    actions = ["polly:SynthesizeSpeech", "comprehend:Detect*"]
    resources = ["*"]
  }

  statement {
    sid    = "loggingPolicies"
    effect = "Allow"
    actions = [
      "logs:PutLogEvents",
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
    ]
    resources = ["${aws_cloudwatch_log_group.lexbot_log_group.arn}:*"]
  }

  statement {
    sid    = "genAiPolicies"
    effect = "Allow"
    actions = [
      "wisdom:CreateSession",
      "wisdom:GetAssistant",
      "wisdom:SendMessage",
      "wisdom:GetNextMessage",
      "bedrock:InvokeAgent",
    ]
    resources = [
      "arn:aws:bedrock:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:agent-alias/*",
      "arn:aws:wisdom:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:*",
    ]
  }
}