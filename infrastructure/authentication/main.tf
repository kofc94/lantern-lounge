terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Google Identity Provider for Cognito
resource "aws_cognito_identity_provider" "google" {
  user_pool_id  = var.cognito_user_pool_id
  provider_name = "Google"
  provider_type = "Google"

  provider_details = {
    authorize_scopes = "openid email profile"
    client_id        = var.google_client_id
    client_secret    = var.google_client_secret
  }

  attribute_mapping = {
    email    = "email"
    name     = "name"
    username = "sub"
  }
}

# Update the existing Cognito App Client to support Google sign-in
# Note: This requires importing the existing app client first
# Run: terraform import aws_cognito_user_pool_client.app <user_pool_id>/<app_client_id>
resource "aws_cognito_user_pool_client" "app" {
  name         = "lantern-lounge-calendar-app"
  user_pool_id = var.cognito_user_pool_id

  # Token validity periods
  id_token_validity      = 60  # 60 minutes
  access_token_validity  = 60  # 60 minutes
  refresh_token_validity = 30  # 30 days

  token_validity_units {
    id_token      = "minutes"
    access_token  = "minutes"
    refresh_token = "days"
  }

  # No client secret (public client for JavaScript)
  generate_secret = false

  # Allowed OAuth flows for public clients
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["implicit", "code"]
  allowed_oauth_scopes                 = ["email", "openid", "profile"]

  # Updated callback URLs for React app
  callback_urls = concat(
    [for domain in var.app_domains : "${domain}/"],
    [for domain in var.app_domains : "${domain}/events"]
  )

  # Logout URLs
  logout_urls = var.app_domains

  # Supported identity providers - include both Cognito and Google
  supported_identity_providers = ["COGNITO", "Google"]

  # Enable token revocation
  enable_token_revocation = true

  # Prevent user existence errors
  prevent_user_existence_errors = "ENABLED"

  # Allowed read and write attributes
  read_attributes = [
    "email",
    "email_verified",
    "name"
  ]

  write_attributes = [
    "email",
    "name"
  ]

  # Explicit auth flows
  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_PASSWORD_AUTH"
  ]

  depends_on = [aws_cognito_identity_provider.google]
}
