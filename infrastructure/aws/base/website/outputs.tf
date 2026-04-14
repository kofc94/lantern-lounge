output "website_bucket_name" {
  description = "Name of the S3 bucket for website hosting"
  value       = aws_s3_bucket.website.bucket
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID for the website"
  value       = aws_cloudfront_distribution.website_distribution.id
}

output "checkin_cloudfront_distribution_id" {
  description = "CloudFront distribution ID for the check-in webapp"
  value       = aws_cloudfront_distribution.checkin_distribution.id
}

output "api_gateway_id" {
  description = "ID of the main API Gateway"
  value       = aws_apigatewayv2_api.main.id
}

output "api_gateway_endpoint" {
  description = "Endpoint URL of the main API Gateway"
  value       = aws_apigatewayv2_api.main.api_endpoint
}

output "api_gateway_execution_arn" {
  description = "Execution ARN of the main API Gateway"
  value       = aws_apigatewayv2_api.main.execution_arn
}

output "route53_zone_id" {
  description = "Route53 hosted zone ID"
  value       = var.route53_zone_id
}

output "website_url" {
  description = "Website URL"
  value       = "https://${var.www_domain_name}"
}
