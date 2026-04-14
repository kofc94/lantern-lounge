variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "development"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "lantern-lounge"
}

variable "dev_account_id" {
  description = "AWS Account ID for the development environment"
  type        = string
  default     = "905418475482"
}
