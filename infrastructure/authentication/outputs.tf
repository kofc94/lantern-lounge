output "google_identity_provider_name" {
  description = "Name of the Google identity provider"
  value       = aws_cognito_identity_provider.google.provider_name
}

output "cognito_hosted_ui_url" {
  description = "Cognito Hosted UI URL for Google sign-in"
  value       = "https://${var.cognito_domain}.auth.${var.aws_region}.amazoncognito.com/oauth2/authorize?identity_provider=Google&redirect_uri=${var.app_domains[0]}&response_type=CODE&client_id=${var.cognito_app_client_id}&scope=openid+email+profile"
}

output "callback_urls" {
  description = "Configured OAuth callback URLs"
  value       = aws_cognito_user_pool_client.app.callback_urls
}

output "supported_identity_providers" {
  description = "List of enabled identity providers"
  value       = aws_cognito_user_pool_client.app.supported_identity_providers
}
