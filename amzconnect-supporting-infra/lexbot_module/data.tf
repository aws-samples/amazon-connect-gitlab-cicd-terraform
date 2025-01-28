data "aws_caller_identity" "current" {}

data "archive_file" "lexbot" {
  type        = "zip"
  source_dir  = "../lexbot"
  output_path = "./ACME_lexbot.zip"
}
