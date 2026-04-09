locals {
  checkin_domain_name = "checkin.lanternlounge.org"
}

# Separate ACM certificate for the checkin subdomain (us-east-1 required for CloudFront)
resource "aws_acm_certificate" "checkin_certificate" {
  provider          = aws.us_east_1
  domain_name       = local.checkin_domain_name
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "checkin_ssl_validation" {
  for_each = {
    for dvo in aws_acm_certificate.checkin_certificate.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = data.aws_route53_zone.main.zone_id
}

resource "aws_acm_certificate_validation" "checkin_ssl_validation" {
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.checkin_certificate.arn
  validation_record_fqdns = [for record in aws_route53_record.checkin_ssl_validation : record.fqdn]

  timeouts {
    create = "15m"
  }
}

# CloudFront distribution for checkin.lanternlounge.org
# Serves from the /checkin prefix of the main website S3 bucket
resource "aws_cloudfront_distribution" "checkin_distribution" {
  origin {
    domain_name = aws_s3_bucket_website_configuration.website.website_endpoint
    origin_id   = "S3-checkin"
    origin_path = "/checkin"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  aliases             = [local.checkin_domain_name]

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-checkin"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }

  # SPA routing: return index.html for unknown paths
  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
  }

  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
  }

  price_class = "PriceClass_100"

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.checkin_ssl_validation.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  tags = {
    Name        = "Lantern Lounge Check-in Web"
    Environment = "production"
  }
}

# Route53 records for checkin subdomain
resource "aws_route53_record" "checkin" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = local.checkin_domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.checkin_distribution.domain_name
    zone_id                = aws_cloudfront_distribution.checkin_distribution.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "checkin_ipv6" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = local.checkin_domain_name
  type    = "AAAA"

  alias {
    name                   = aws_cloudfront_distribution.checkin_distribution.domain_name
    zone_id                = aws_cloudfront_distribution.checkin_distribution.hosted_zone_id
    evaluate_target_health = false
  }
}
