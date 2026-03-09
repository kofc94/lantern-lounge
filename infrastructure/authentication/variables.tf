variable "google_client_id" {
  description = "Google OAuth 2.0 Client ID from Google Cloud Console"
  type        = string
  sensitive   = true
}

variable "google_client_secret" {
  description = "Google OAuth 2.0 Client Secret from Google Cloud Console"
  type        = string
  sensitive   = true
}

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

variable "app_domains" {
  description = "List of application domains for OAuth callbacks"
  type        = list(string)
  default = [
    "http://localhost:5174",
    "https://www.lanternlounge.org",
    "https://lanternlounge.org"
  ]
}
