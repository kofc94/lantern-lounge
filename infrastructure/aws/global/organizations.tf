
resource "aws_organizations_organization" "main" {
  # Enable IAM Identity Center (SSO) and CloudTrail to work across the org
  aws_service_access_principals = [
    "sso.amazonaws.com",
    "cloudtrail.amazonaws.com",
  ]

  feature_set = "ALL"
}

# Lantern Lounge Production account
resource "aws_organizations_account" "lantern_lounge" {
  name  = "Lantern Lounge"
  email = "aws@lanternlounge.org"

  # Default role created by Organizations in the member account
  role_name = "OrganizationAccountAccessRole"

  # Prevent accidental deletion of the member account
  close_on_deletion = false

  lifecycle {
    # AWS does not allow changing role_name after creation
    ignore_changes = [role_name]
  }

  tags = {
    Environment = "production"
    Project     = var.project_name
  }
}

# Lantern Lounge Development account (currently suspended in AWS)
# resource "aws_organizations_account" "dev" {
#   name  = "Lantern Lounge Dev"
#   email = "eledonne+dev@gmail.com"
#
#   # Default role created by Organizations in the member account
#   role_name = "OrganizationAccountAccessRole"
#
#   # Prevent accidental deletion of the member account
#   close_on_deletion = false
#
#   lifecycle {
#     # AWS does not allow changing role_name after creation
#     ignore_changes = [role_name]
#   }
#
#   tags = {
#     Environment = "development"
#     Project     = var.project_name
#   }
# }
