output "website_bucket_name" {
  description = "Name of the S3 bucket for website hosting"
  value       = aws_s3_bucket.website.bucket
}

output "cloudfront_distribution_id" {
  description = " CloudFront distribution ID for the website"
  value       = aws_cloudfront_distribution.website_distribution.id
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.website_distribution.domain_name
}

output "route53_zone_id" {
  description = "Route53 hosted zone ID"
  value       = data.aws_route53_zone.main.zone_id
}

output "route53_name_servers" {
  description = "Route53 name servers (already configured since AWS is the registrar)"
  value       = data.aws_route53_zone.main.name_servers
}

output "ssl_certificate_arn" {
  description = "ARN of the SSL certificate (not validated yet)"
  value       = aws_acm_certificate.ssl_certificate.arn
}

output "temp_website_url" {
  description = "Temporary website URL (use this until SSL is configured)"
  value       = "https://${aws_cloudfront_distribution.website_distribution_temp.domain_name}"
}

output "final_website_url" {
  description = "Final website URL (after SSL setup)"
  value       = "https://${local.www_domain_name}"
}

output "certificate_validation_records" {
  description = "DNS records created for certificate validation"
  value = {
    for dvo in aws_acm_certificate.ssl_certificate.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      type   = dvo.resource_record_type
      value  = dvo.resource_record_value
    }
  }
}

# Calendar API Outputs
output "api_gateway_endpoint" {
  description = "API Gateway endpoint URL for calendar API"
  value       = aws_apigatewayv2_api.calendar_api.api_endpoint
}

output "api_gateway_id" {
  description = "API Gateway ID"
  value       = aws_apigatewayv2_api.calendar_api.id
}

# Cognito Outputs
output "cognito_user_pool_id" {
  description = "Cognito User Pool ID for calendar authentication"
  value       = aws_cognito_user_pool.calendar_users.id
}

output "cognito_user_pool_arn" {
  description = "Cognito User Pool ARN"
  value       = aws_cognito_user_pool.calendar_users.arn
}

output "cognito_app_client_id" {
  description = "Cognito App Client ID for JavaScript frontend"
  value       = aws_cognito_user_pool_client.calendar_app.id
}

output "cognito_domain" {
  description = "Cognito User Pool Domain"
  value       = aws_cognito_user_pool_domain.calendar_domain.domain
}

# DynamoDB Output
output "dynamodb_table_name" {
  description = "DynamoDB table name for calendar items"
  value       = aws_dynamodb_table.calendar_items.name
}

output "dynamodb_table_arn" {
  description = "DynamoDB table ARN"
  value       = aws_dynamodb_table.calendar_items.arn
}

# Configuration for Frontend
output "frontend_config" {
  description = "Configuration values for frontend JavaScript"
  value = {
    apiEndpoint     = aws_apigatewayv2_api.calendar_api.api_endpoint
    userPoolId      = aws_cognito_user_pool.calendar_users.id
    userPoolRegion  = var.aws_region
    appClientId     = aws_cognito_user_pool_client.calendar_app.id
    cognitoDomain   = "${aws_cognito_user_pool_domain.calendar_domain.domain}.auth.${var.aws_region}.amazoncognito.com"
    hostedUIUrl     = "https://${aws_cognito_user_pool_domain.calendar_domain.domain}.auth.${var.aws_region}.amazoncognito.com/login?client_id=${aws_cognito_user_pool_client.calendar_app.id}&response_type=code&redirect_uri=https://${local.www_domain_name}/calendar.html"
  }
}