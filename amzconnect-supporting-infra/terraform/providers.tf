provider "aws" {
  region = var.region
  #   assume_role {
  #     role_arn = var.deploy_role_arn
  #   }
}

provider "awscc" {
  region = var.region
  #   assume_role = {
  #     role_arn = var.deploy_role_arn
  #   }
}
