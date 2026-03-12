output "api_gateway_endpoint" {
  description = "API Gateway endpoint URL for calendar API"
  value       = aws_apigatewayv2_api.calendar_api.api_endpoint
}

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = aws_cognito_user_pool.calendar_users.id
}

output "cognito_app_client_id" {
  description = "Cognito App Client ID for JavaScript frontend"
  value       = aws_cognito_user_pool_client.calendar_app.id
}

output "cognito_domain" {
  description = "Cognito User Pool Domain"
  value       = aws_cognito_user_pool_domain.calendar_domain.domain
}

output "dynamodb_table_name" {
  description = "DynamoDB table name for calendar items"
  value       = aws_dynamodb_table.calendar_items.name
}

output "frontend_config" {
  description = "Configuration values for the React frontend"
  value = {
    apiEndpoint    = aws_apigatewayv2_api.calendar_api.api_endpoint
    userPoolId     = aws_cognito_user_pool.calendar_users.id
    userPoolRegion = var.aws_region
    appClientId    = aws_cognito_user_pool_client.calendar_app.id
    cognitoDomain  = "${aws_cognito_user_pool_domain.calendar_domain.domain}.auth.${var.aws_region}.amazoncognito.com"
  }
}
