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