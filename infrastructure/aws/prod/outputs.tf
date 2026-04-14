output "website_bucket_name" {
  description = "Name of the S3 bucket for website hosting"
  value       = module.website.website_bucket_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID for the website"
  value       = module.website.cloudfront_distribution_id
}

output "checkin_cloudfront_distribution_id" {
  description = "CloudFront distribution ID for the check-in webapp"
  value       = module.website.checkin_cloudfront_distribution_id
}

output "api_gateway_id" {
  description = "ID of the main API Gateway"
  value       = module.website.api_gateway_id
}

output "api_gateway_endpoint" {
  description = "Endpoint URL of the main API Gateway"
  value       = module.website.api_gateway_endpoint
}

output "api_gateway_execution_arn" {
  description = "Execution ARN of the main API Gateway"
  value       = module.website.api_gateway_execution_arn
}

output "route53_zone_id" {
  description = "Route53 hosted zone ID"
  value       = module.website.route53_zone_id
}

output "website_url" {
  description = "Website URL"
  value       = module.website.website_url
}
