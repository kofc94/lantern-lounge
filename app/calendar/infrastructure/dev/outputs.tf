output "api_gateway_endpoint" {
  description = "API Gateway endpoint URL for calendar API"
  value       = aws_apigatewayv2_api.calendar_api.api_endpoint
}

output "dynamodb_table_name" {
  description = "DynamoDB table name for calendar items"
  value       = aws_dynamodb_table.calendar_items.name
}

output "frontend_config" {
  description = "Configuration values for the React frontend"
  value = {
    apiEndpoint    = aws_apigatewayv2_api.calendar_api.api_endpoint
    userPoolId     = data.terraform_remote_state.cognito.outputs.cognito_user_pool_id
    userPoolRegion = var.aws_region
    appClientId    = data.terraform_remote_state.cognito.outputs.cognito_user_pool_client_id
    cognitoDomain  = "${data.terraform_remote_state.cognito.outputs.cognito_domain}.auth.${var.aws_region}.amazoncognito.com"
  }
}
