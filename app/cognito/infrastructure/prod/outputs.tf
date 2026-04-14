output "users_api_endpoint" {
  description = "API Gateway endpoint for user management (admin only)"
  value       = module.cognito.users_api_endpoint
}

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = module.cognito.cognito_user_pool_id
}

output "cognito_user_pool_client_id" {
  description = "Cognito App Client ID for JavaScript frontend"
  value       = module.cognito.cognito_user_pool_client_id
}

output "checkin_app_client_id" {
  description = "Cognito App Client ID for the staff check-in app"
  value       = module.cognito.checkin_app_client_id
}

output "cognito_domain" {
  description = "Cognito User Pool Domain"
  value       = module.cognito.cognito_domain
}

output "cognito_hosted_ui_url" {
  description = "Cognito Hosted UI URL for sign-in"
  value       = module.cognito.cognito_hosted_ui_url
}

output "cognito_api_endpoint" {
  description = "API Gateway endpoint for internal Cognito user management"
  value       = module.cognito.cognito_api_endpoint
}
