output "api_gateway_endpoint" {
  description = "API Gateway endpoint URL for calendar API"
  value       = module.calendar.api_gateway_endpoint
}

output "dynamodb_table_name" {
  description = "DynamoDB table name for calendar items"
  value       = module.calendar.dynamodb_table_name
}

output "frontend_config" {
  description = "Configuration values for the React frontend"
  value       = module.calendar.frontend_config
}
