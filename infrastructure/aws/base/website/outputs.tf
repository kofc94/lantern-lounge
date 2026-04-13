output "website_bucket_name" {
  description = "Name of the S3 bucket for website hosting"
  value       = aws_s3_bucket.website.bucket
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID for the website"
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

output "ssl_certificate_arn" {
  description = "ARN of the SSL certificate"
  value       = aws_acm_certificate.ssl_certificate.arn
}

output "website_url" {
  description = "Website URL"
  value       = "https://${local.www_domain_name}"
}

output "github_actions_role_arn" {
  description = "IAM role ARN to set as AWS_ROLE_ARN in GitHub Actions variables"
  value       = aws_iam_role.github_actions_terraform.arn
}

output "checkin_cloudfront_distribution_id" {
  description = "CloudFront distribution ID for checkin.lanternlounge.org"
  value       = aws_cloudfront_distribution.checkin_distribution.id
}

output "checkin_website_url" {
  description = "Check-in web app URL"
  value       = "https://${local.checkin_domain_name}"
}

output "sso_portal_url" {
  description = "AWS access portal URL — set a custom subdomain in IAM Identity Center → Settings → Customize AWS access portal URL"
  value       = "https://${tolist(data.aws_ssoadmin_instances.main.identity_store_ids)[0]}.awsapps.com/start"
}
