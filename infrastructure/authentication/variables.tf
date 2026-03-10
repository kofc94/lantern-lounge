variable "project_name" {
  description = "Name of the project (must match aws module)"
  type        = string
  default     = "lantern-lounge"
}

variable "environment" {
  description = "Environment name (must match aws module)"
  type        = string
  default     = "production"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "google_org_id" {
  description = "Google Cloud organization ID for eledonne-org"
  type        = string
}

variable "google_project_id" {
  description = "Google Cloud project ID (must be globally unique)"
  type        = string
  default     = "lantern-lounge-auth"
}

variable "google_support_email" {
  description = "Support email shown on the Google OAuth consent screen"
  type        = string
}
