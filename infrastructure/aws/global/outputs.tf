output "dev_account_id" {
  description = "AWS Account ID for the development environment"
  value       = aws_organizations_account.dev.id
}

output "prod_account_id" {
  description = "AWS Account ID for the production environment"
  value       = aws_organizations_account.prod.id
}

output "github_actions_role_arn" {
  description = "ARN of the GitHub Actions OIDC role"
  value       = aws_iam_role.github_actions_terraform.arn
}
