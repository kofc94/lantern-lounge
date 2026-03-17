variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "lantern-lounge"
}

variable "admin_email" {
  description = "Email address for the SSO admin user (Eric LeDonne)"
  type        = string
  default     = "eledonne@gmail.com"
}

variable "api_gateway_domain" {
  description = "Domain name of the API Gateway (without https://)"
  type        = string
}