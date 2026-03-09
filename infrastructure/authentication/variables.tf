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

variable "cognito_user_pool_id" {
  description = "ID of the existing Cognito User Pool"
  type        = string
}

variable "cognito_app_client_id" {
  description = "ID of the existing Cognito App Client"
  type        = string
}

variable "cognito_domain" {
  description = "Cognito domain prefix for hosted UI"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "app_domains" {
  description = "List of application domains for OAuth callbacks"
  type        = list(string)
  default     = [
    "http://localhost:5174",
    "https://www.lanternlounge.org",
    "https://lanternlounge.org"
  ]
}
