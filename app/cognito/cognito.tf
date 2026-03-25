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

  lambda_config {
    post_confirmation = aws_lambda_function.post_confirmation.arn
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
  id_token_validity      = 60 # 60 minutes
  access_token_validity  = 60 # 60 minutes
  refresh_token_validity = 30 # 30 days

  token_validity_units {
    id_token      = "minutes"
    access_token  = "minutes"
    refresh_token = "days"
  }

  # Allowed OAuth flows for public clients
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["implicit", "code"]
  allowed_oauth_scopes                 = ["email", "openid", "profile", "aws.cognito.signin.user.admin"]

  # Callback URLs
  callback_urls = [
    "https://${local.www_domain_name}/",
    "https://${local.domain_name}/",
    "http://localhost:5173/"
  ]

  # Logout URLs
  logout_urls = [
    "https://${local.www_domain_name}/",
    "https://${local.domain_name}/",
    "http://localhost:5173/"
  ]

  # Supported identity providers
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
    "ALLOW_USER_PASSWORD_AUTH" # For direct sign-in
  ]
}

# Optional: Cognito User Pool Domain (for hosted UI)
resource "aws_cognito_user_pool_domain" "calendar_domain" {
  domain       = "${var.project_name}-calendar-${var.environment}"
  user_pool_id = aws_cognito_user_pool.calendar_users.id
}

# ── Groups ────────────────────────────────────────────────────────────────────

resource "aws_cognito_user_group" "user" {
  name         = "user"
  user_pool_id = aws_cognito_user_pool.calendar_users.id
  description  = "Standard registered users"
  precedence   = 100
}

resource "aws_cognito_user_group" "admin" {
  name         = "admin"
  user_pool_id = aws_cognito_user_pool.calendar_users.id
  description  = "Administrators with elevated privileges"
  precedence   = 1
}

# ── Admin assignments ──────────────────────────────────────────────────────────
# Add Cognito usernames here to grant admin access.
# For Google OAuth users, the username is the Google sub ID.
# Look it up after first login:
#   aws cognito-idp list-users --user-pool-id <pool-id> --filter "email = \"user@example.com\""
locals {
  admin_users = [
    # "109876543210987654321",  # example: Jane Doe (jane@example.com)
    "Google_104269928361937576762"
  ]
}

resource "aws_cognito_user_in_group" "admin" {
  for_each     = toset(local.admin_users)
  user_pool_id = aws_cognito_user_pool.calendar_users.id
  group_name   = aws_cognito_user_group.admin.name
  username     = each.value
}

