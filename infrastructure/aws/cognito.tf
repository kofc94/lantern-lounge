# Cognito User Pool for authentication
resource "aws_cognito_user_pool" "calendar_users" {
  name = "${var.project_name}-calendar-users"

  # Allow users to sign in with email
  username_attributes = ["email"]

  # Auto-verify email addresses
  auto_verified_attributes = ["email"]

  # Password policy
  password_policy {
    minimum_length                   = 8
    require_lowercase                = true
    require_numbers                  = true
    require_symbols                  = true
    require_uppercase                = true
    temporary_password_validity_days = 7
  }

  # User attributes
  schema {
    name                = "email"
    attribute_data_type = "String"
    required            = true
    mutable             = true

    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  schema {
    name                = "name"
    attribute_data_type = "String"
    required            = true
    mutable             = true

    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  # Account recovery settings
  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  # Email configuration (using Cognito's default email for cost savings)
  email_configuration {
    email_sending_account = "COGNITO_DEFAULT"
  }

  # User pool add-ons
  user_pool_add_ons {
    advanced_security_mode = "AUDIT" # Free tier - logs suspicious activity
  }

  # Prevent user existence errors (security best practice)
  user_attribute_update_settings {
    attributes_require_verification_before_update = ["email"]
  }

  tags = {
    Name        = "Lantern Lounge Calendar Users"
    Environment = var.environment
    Project     = var.project_name
  }
}

# App Client for JavaScript frontend (no client secret)
resource "aws_cognito_user_pool_client" "calendar_app" {
  name         = "${var.project_name}-calendar-app"
  user_pool_id = aws_cognito_user_pool.calendar_users.id

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

  # Callback URLs (update with your actual domain after testing)
  callback_urls = [
    "https://${local.www_domain_name}/calendar.html",
    "https://${local.domain_name}/calendar.html",
    "http://localhost:8080/calendar.html" # For local testing
  ]

  # Logout URLs
  logout_urls = [
    "https://${local.www_domain_name}",
    "https://${local.domain_name}",
    "http://localhost:8080"
  ]

  # Supported identity providers
  supported_identity_providers = ["COGNITO"]

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
    "ALLOW_USER_PASSWORD_AUTH" # For direct sign-in
  ]
}

# Optional: Cognito User Pool Domain (for hosted UI)
resource "aws_cognito_user_pool_domain" "calendar_domain" {
  domain       = "${var.project_name}-calendar-${var.environment}"
  user_pool_id = aws_cognito_user_pool.calendar_users.id
}

# Output the hosted UI URL
output "cognito_hosted_ui_url" {
  description = "Cognito Hosted UI URL for sign-in"
  value       = "https://${aws_cognito_user_pool_domain.calendar_domain.domain}.auth.${var.aws_region}.amazoncognito.com/login?client_id=${aws_cognito_user_pool_client.calendar_app.id}&response_type=code&redirect_uri=https://${local.www_domain_name}/calendar.html"
}
