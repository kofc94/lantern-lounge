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

variable "prod_account_id" {
  description = "AWS Account ID for the production environment"
  type        = string
  default     = "781714039554"
}
