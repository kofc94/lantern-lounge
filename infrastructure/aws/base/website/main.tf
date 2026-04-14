terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source                = "hashicorp/aws"
      version               = "~> 5.0"
      configuration_aliases = [aws.us_east_1, aws.dns]
    }
  }
}

# SSL Certificate for both domains
resource "aws_acm_certificate" "ssl_certificate" {
  provider                  = aws.us_east_1
  domain_name               = var.domain_name
  subject_alternative_names = [var.www_domain_name]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

# Route53 records for ACM certificate validation
resource "aws_route53_record" "ssl_validation" {
  provider = aws.dns
  for_each = {
    for dvo in aws_acm_certificate.ssl_certificate.domain_validation_options : dvo.domain_name => {
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
  zone_id         = var.route53_zone_id
}

# SSL certificate validation
resource "aws_acm_certificate_validation" "ssl_validation" {
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.ssl_certificate.arn
  validation_record_fqdns = [for record in aws_route53_record.ssl_validation : record.fqdn]

  timeouts {
    create = "15m"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# S3 bucket for the main website
resource "aws_s3_bucket" "website" {
  bucket = var.www_domain_name
}

resource "aws_s3_bucket_website_configuration" "website" {
  bucket = aws_s3_bucket.website.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}

# S3 bucket for redirecting root domain to www
resource "aws_s3_bucket" "redirect" {
  bucket = var.domain_name
}

resource "aws_s3_bucket_website_configuration" "redirect" {
  bucket = aws_s3_bucket.redirect.id

  redirect_all_requests_to {
    host_name = var.www_domain_name
    protocol  = "https"
  }
}

# S3 bucket public access configuration - Matching existing 'false' settings to minimize diff
resource "aws_s3_bucket_public_access_block" "website" {
  bucket = aws_s3_bucket.website.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_public_access_block" "redirect" {
  bucket = aws_s3_bucket.redirect.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# CloudFront distribution for the main website
resource "aws_cloudfront_distribution" "website_distribution" {
  origin {
    domain_name = aws_s3_bucket.website.bucket_regional_domain_name
    origin_id   = "S3-${var.www_domain_name}"
    # OAC removed for now to minimize diff if not currently used
  }

  origin {
    domain_name = replace(aws_apigatewayv2_api.main.api_endpoint, "https://", "")
    origin_id   = "APIGateway"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  aliases             = [var.www_domain_name]

  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${var.www_domain_name}"
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

  # Restoring Calendar Cache Behavior
  ordered_cache_behavior {
    path_pattern     = "/calendar/*"
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "APIGateway"

    forwarded_values {
      query_string = true
      headers      = ["Authorization"]
      cookies {
        forward = "none"
      }
    }

    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0
    compress               = true
    viewer_protocol_policy = "redirect-to-https"
  }

  # Restoring Assets Cache Behavior
  ordered_cache_behavior {
    path_pattern     = "/assets/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${var.www_domain_name}"

    forwarded_values {
      query_string = false
      headers      = ["Origin"]
      cookies {
        forward = "none"
      }
    }

    min_ttl                = 0
    default_ttl            = 86400
    max_ttl                = 31536000
    compress               = true
    viewer_protocol_policy = "redirect-to-https"
  }

  custom_error_response {
    error_caching_min_ttl = 0
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
  }

  custom_error_response {
    error_caching_min_ttl = 0
    error_code            = 404
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
    acm_certificate_arn      = aws_acm_certificate_validation.ssl_validation.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  tags = {
    Name        = "Lantern Lounge Website"
    Environment = var.environment
  }
}

# Route53 A records for www subdomain
resource "aws_route53_record" "www" {
  provider = aws.dns
  zone_id  = var.route53_zone_id
  name     = var.www_domain_name
  type     = "A"

  alias {
    name                   = aws_cloudfront_distribution.website_distribution.domain_name
    zone_id                = aws_cloudfront_distribution.website_distribution.hosted_zone_id
    evaluate_target_health = false
  }
}

# Route53 A records for root domain
resource "aws_route53_record" "root" {
  provider = aws.dns
  zone_id  = var.route53_zone_id
  name     = var.domain_name
  type     = "A"

  alias {
    name                   = aws_cloudfront_distribution.redirect_distribution.domain_name
    zone_id                = aws_cloudfront_distribution.redirect_distribution.hosted_zone_id
    evaluate_target_health = false
  }
}

# Route53 AAAA records for IPv6 support
resource "aws_route53_record" "www_ipv6" {
  provider = aws.dns
  zone_id  = var.route53_zone_id
  name     = var.www_domain_name
  type     = "AAAA"

  alias {
    name                   = aws_cloudfront_distribution.website_distribution.domain_name
    zone_id                = aws_cloudfront_distribution.website_distribution.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "root_ipv6" {
  provider = aws.dns
  zone_id  = var.route53_zone_id
  name     = var.domain_name
  type     = "AAAA"

  alias {
    name                   = aws_cloudfront_distribution.redirect_distribution.domain_name
    zone_id                = aws_cloudfront_distribution.redirect_distribution.hosted_zone_id
    evaluate_target_health = false
  }
}

# CloudFront distribution for root domain redirect
resource "aws_cloudfront_distribution" "redirect_distribution" {
  origin {
    domain_name = aws_s3_bucket.redirect.bucket_regional_domain_name
    origin_id   = "S3-${var.domain_name}"
  }

  enabled         = true
  is_ipv6_enabled = true
  aliases         = [var.domain_name]

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${var.domain_name}"
    viewer_protocol_policy = "allow-all"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.redirect_to_www.arn
    }

    min_ttl     = 0
    default_ttl = 300
    max_ttl     = 1200
  }

  price_class = "PriceClass_100"

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.ssl_validation.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  tags = {
    Name        = "Lantern Lounge Redirect"
    Environment = var.environment
  }
}

# CloudFront Function: redirect root → www preserving query strings
resource "aws_cloudfront_function" "redirect_to_www" {
  name    = "lantern-lounge-redirect-to-www"
  runtime = "cloudfront-js-2.0"
  publish = true
  code    = <<-EOF
    function handler(event) {
      var request = event.request;
      var keys = Object.keys(request.querystring);
      var qs = keys.length > 0
        ? '?' + keys.map(function(k) {
            var v = request.querystring[k];
            return encodeURIComponent(k) + '=' + encodeURIComponent(v.value);
          }).join('&')
        : '';
      return {
        statusCode: 301,
        statusDescription: 'Moved Permanently',
        headers: { location: { value: 'https://${var.www_domain_name}' + request.uri + qs } }
      };
    }
  EOF
}
