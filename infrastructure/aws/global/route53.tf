resource "aws_route53_zone" "main" {
  name = "lanternlounge.org"
  
  # Prevent accidental deletion of the zone
  lifecycle {
    prevent_destroy = true
  }

  tags = {
    Project     = var.project_name
    Environment = "global"
  }
}

output "route53_zone_id" {
  description = "The ID of the main Route53 Hosted Zone"
  value       = aws_route53_zone.main.zone_id
}
