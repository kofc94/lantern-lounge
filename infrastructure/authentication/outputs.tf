output "google_identity_provider_name" {
  description = "Name of the Google identity provider"
  value       = aws_cognito_identity_provider.google.provider_name
}

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = tolist(data.aws_cognito_user_pools.existing.ids)[0]
}

output "cognito_app_client_id" {
  description = "Cognito App Client ID"
  value       = aws_cognito_user_pool_client.app.id
}

output "cognito_domain" {
  description = "Cognito domain for hosted UI"
  value       = "${var.project_name}-calendar-${var.environment}"
}

output "cognito_hosted_ui_url" {
  description = "Cognito Hosted UI URL for Google sign-in"
  value       = "https://${var.project_name}-calendar-${var.environment}.auth.${var.aws_region}.amazoncognito.com/oauth2/authorize?identity_provider=Google&redirect_uri=${var.app_domains[0]}&response_type=CODE&client_id=${aws_cognito_user_pool_client.app.id}&scope=openid+email+profile"
}

output "callback_urls" {
  description = "Configured OAuth callback URLs"
  value       = aws_cognito_user_pool_client.app.callback_urls
}

output "supported_identity_providers" {
  description = "List of enabled identity providers"
  value       = aws_cognito_user_pool_client.app.supported_identity_providers
}
