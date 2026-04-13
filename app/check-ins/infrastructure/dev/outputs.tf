output "api_gateway_endpoint" {
  description = "API Gateway endpoint URL for check-ins API"
  value       = aws_apigatewayv2_api.checkins_api.api_endpoint
}

output "dynamodb_table_name" {
  description = "DynamoDB table name for guest check-ins"
  value       = aws_dynamodb_table.check_ins.name
}

output "frontend_config" {
  description = "Configuration values for the React frontend check-ins integration"
  value = {
    checkinsApiEndpoint = aws_apigatewayv2_api.checkins_api.api_endpoint
  }
}
