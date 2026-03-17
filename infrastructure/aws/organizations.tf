# AWS Organizations — manages the root organization and member accounts
#
# IMPORT REQUIRED: The organization already exists. Before running `tofu apply`,
# import it with:
#
#   tofu import aws_organizations_organization.main r-xxxx
#
# Replace r-xxxx with your organization root ID. Find it with:
#   aws organizations list-roots --query 'Roots[0].Id' --output text
#
# Or use the import block below (uncomment and fill in the id):
#
# import {
#   to = aws_organizations_organization.main
#   id = "r-xxxx"
# }

resource "aws_organizations_organization" "main" {
  # Enable IAM Identity Center (SSO) and CloudTrail to work across the org
  aws_service_access_principals = [
    "sso.amazonaws.com",
    "cloudtrail.amazonaws.com",
  ]

  feature_set = "ALL"
}

# Lantern Lounge member account
# AWS will send an email to aws@lanternlounge.org when this account is first created.
# The account is created immediately — no verification step required.
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
    Environment = var.environment
    Project     = var.project_name
  }
}
