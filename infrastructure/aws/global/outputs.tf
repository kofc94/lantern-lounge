output "dev_account_id" {
  description = "AWS Account ID for the development environment"
  value       = "905418475482" # Hardcoded because account is suspended and cannot be imported
}

output "prod_account_id" {
  description = "AWS Account ID for the production environment"
  value       = aws_organizations_account.lantern_lounge.id
}

output "github_actions_role_arn" {
  description = "ARN of the GitHub Actions OIDC role"
  value       = aws_iam_role.github_actions_terraform.arn
}

output "sso_portal_url" {
  description = "AWS access portal URL"
  value       = "https://${tolist(data.aws_ssoadmin_instances.main.identity_store_ids)[0]}.awsapps.com/start"
}
