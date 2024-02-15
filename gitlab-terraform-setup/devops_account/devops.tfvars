aws_region = "us-east-1"
match_field = "aud"
repo_value = "YOUR_GITLAB_ID/YOUR_REPO"
aud_value   = "https://gitlab.example.com"
sdlc_roles  = ["arn:aws:iam::DEVELOP_ACCOUNT_NUMBER:role/GitLabCI_WorkshopDeploymentRole", "arn:aws:iam::STAGE_ACCOUNT_NUMBER:role/GitLabCI_WorkshopDeploymentRole", "arn:aws:iam::PROD_ACCOUNT_NUMBER:role/GitLabCI_WorkshopDeploymentRole"]
