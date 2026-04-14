variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (e.g., development, production)"
  type        = string
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "lantern-lounge"
}

variable "domain_name" {
  description = "Root domain name for the website"
  type        = string
}

variable "route53_zone_id" {
  description = "The ID of the Route53 Hosted Zone"
  type        = string
}

variable "www_domain_name" {
  description = "WWW subdomain for the website"
  type        = string
}

variable "checkin_domain_name" {
  description = "Subdomain for the check-in web application"
  type        = string
}
