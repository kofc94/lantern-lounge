# Enable Google Wallet Objects API
resource "google_project_service" "wallet" {
  project            = google_project.lantern_lounge.project_id
  service            = "walletobjects.googleapis.com"
  disable_on_destroy = false
  depends_on         = [google_project_service.cloudresourcemanager]
}

# Service account used by the check-ins Lambda to sign Google Wallet pass JWTs
resource "google_service_account" "wallet_lambda" {
  account_id   = "wallet-lambda"
  display_name = "Wallet Lambda"
  description  = "Signs Google Wallet pass JWTs for the check-ins API"
  project      = google_project.lantern_lounge.project_id
}

# Service account key (stored in AWS SSM)
resource "google_service_account_key" "wallet_lambda" {
  service_account_id = google_service_account.wallet_lambda.name
}

# Store the JSON key in AWS SSM as a SecureString
resource "aws_ssm_parameter" "google_wallet_service_account_key" {
  name  = "/lantern-lounge/google/wallet-service-account-key"
  type  = "SecureString"
  value = base64decode(google_service_account_key.wallet_lambda.private_key)
}

output "wallet_service_account_email" {
  value       = google_service_account.wallet_lambda.email
  description = "Add this service account to your Google Wallet Issuer at pay.google.com/business/console, then store the Issuer ID in SSM at /lantern-lounge/google/wallet-issuer-id"
}
