# Example: Google Cloud Project and OAuth Setup with Terraform
# This file shows what's POSSIBLE but requires additional setup
# Rename to google-cloud.tf and configure to use

# NOTE: This requires:
# 1. Google Cloud organization or billing account
# 2. Service account with appropriate permissions
# 3. GOOGLE_APPLICATION_CREDENTIALS environment variable set
# 4. Additional Terraform provider configuration


# Google Cloud provider configuration
# Requires: export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
provider "google" {
  project = var.google_project_id
  region  = "us-central1"
}

variable "google_project_id" {
  description = "Google Cloud Project ID (must be globally unique)"
  type        = string
  default     = "lantern-lounge-auth"
}

variable "google_org_id" {
  description = "Google Cloud Organization ID (optional, can use billing account instead)"
  type        = string
  default     = ""
}

# Create Google Cloud Project (requires billing account or organization)
resource "google_project" "auth_project" {
  name            = "Lantern Lounge Auth"
  project_id      = var.google_project_id
  org_id          = var.google_org_id != "" ? var.google_org_id : null

  # Prevent accidental deletion
  lifecycle {
    prevent_destroy = true
  }
}

# Enable required APIs
resource "google_project_service" "identity" {
  project = google_project.auth_project.project_id
  service = "identitytoolkit.googleapis.com"

  disable_on_destroy = false
}

resource "google_project_service" "oauth2" {
  project = google_project.auth_project.project_id
  service = "oauth2.googleapis.com"

  disable_on_destroy = false
}

resource "google_project_service" "people" {
  project = google_project.auth_project.project_id
  service = "people.googleapis.com"

  disable_on_destroy = false
}

# OAuth Consent Screen
resource "google_iap_brand" "auth_consent" {
  support_email     = "support@lanternlounge.org"
  application_title = "Lantern Lounge"
  project           = google_project.auth_project.project_id

  depends_on = [
    google_project_service.identity,
    google_project_service.oauth2
  ]
}

# OAuth 2.0 Client (Web Application)
resource "google_iap_client" "oauth_client" {
  display_name = "Lantern Lounge Web App"
  brand        = google_iap_brand.auth_consent.name

  # Note: This creates an IAP client, not a standard OAuth client
  # For standard OAuth clients, you may need to use the Google Cloud Console
  # or the google_oauth2_client resource (if available in newer provider versions)
}

# LIMITATION: Terraform's Google provider has limited support for OAuth client credentials
# The redirect URIs cannot be fully configured via Terraform currently
# You'll still need to manually configure:
# - Authorized JavaScript origins
# - Authorized redirect URIs
# - OAuth scopes

# Outputs
output "google_project_id" {
  description = "Google Cloud Project ID"
  value       = google_project.auth_project.project_id
}

output "google_oauth_client_id" {
  description = "OAuth Client ID"
  value       = google_iap_client.oauth_client.client_id
  sensitive   = true
}

output "google_oauth_client_secret" {
  description = "OAuth Client Secret"
  value       = google_iap_client.oauth_client.secret
  sensitive   = true
}

output "manual_steps_required" {
  description = "Manual steps still required in Google Cloud Console"
  value = <<-EOT
    Even with Terraform, you'll need to manually configure in Google Cloud Console:

    1. Go to APIs & Services → Credentials
    2. Click on the OAuth 2.0 Client ID created by Terraform
    3. Add Authorized redirect URIs:
       - https://lantern-lounge-calendar-production.auth.us-east-1.amazoncognito.com/oauth2/idpresponse
    4. Save changes

    OAuth credentials can be retrieved from Terraform outputs.
  EOT
}
