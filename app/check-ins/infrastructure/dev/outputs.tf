output "api_gateway_endpoint" {
  description = "API Gateway endpoint URL for check-ins API"
  value       = module.checkins.api_gateway_endpoint
}

output "dynamodb_table_name" {
  description = "DynamoDB table name for check-ins"
  value       = module.checkins.dynamodb_table_name
}

output "frontend_config" {
  description = "Configuration values for the React frontend"
  value       = module.checkins.frontend_config
}
