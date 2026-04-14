variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (e.g., dev, prod)"
  type        = string
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "lantern-lounge"
}

variable "domain_name" {
  description = "Root domain name"
  type        = string
}

variable "www_domain_name" {
  description = "WWW subdomain name"
  type        = string
}
