output "users_api_endpoint" {
  description = "Users API Gateway Endpoint"
  value       = aws_apigatewayv2_api.users_api.api_endpoint
}

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = aws_cognito_user_pool.calendar_users.id
}

output "cognito_user_pool_client_id" {
  description = "Cognito App Client ID for JavaScript frontend"
  value       = aws_cognito_user_pool_client.calendar_app.id
}

output "cognito_domain" {
  description = "Cognito User Pool Domain"
  value       = aws_cognito_user_pool_domain.calendar_domain.domain
}

output "cognito_hosted_ui_url" {
  description = "Cognito Hosted UI URL for sign-in"
  value       = "https://${aws_cognito_user_pool_domain.calendar_domain.domain}.auth.${var.aws_region}.amazoncognito.com/login?client_id=${aws_cognito_user_pool_client.calendar_app.id}&response_type=code&redirect_uri=https://${local.www_domain_name}/calendar.html"
}
