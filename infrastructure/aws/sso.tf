# AWS IAM Identity Center (SSO) — Built-in directory
#
# PREREQUISITE: Enable IAM Identity Center in the AWS Console before running
# `tofu apply`. Go to: IAM Identity Center → Enable
# Choose "Built-in directory" as the identity source (the default).

data "aws_ssoadmin_instances" "main" {}

data "aws_caller_identity" "current" {}

locals {
  sso_instance_arn  = tolist(data.aws_ssoadmin_instances.main.arns)[0]
  identity_store_id = tolist(data.aws_ssoadmin_instances.main.identity_store_ids)[0]
}

# ── Permission Sets ──────────────────────────────────────────────────────────

resource "aws_ssoadmin_permission_set" "administrator" {
  name             = "AdministratorAccess"
  instance_arn     = local.sso_instance_arn
  session_duration = "PT8H"

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_ssoadmin_managed_policy_attachment" "administrator" {
  instance_arn       = local.sso_instance_arn
  permission_set_arn = aws_ssoadmin_permission_set.administrator.arn
  managed_policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
}

resource "aws_ssoadmin_permission_set" "read_only" {
  name             = "ReadOnlyAccess"
  instance_arn     = local.sso_instance_arn
  session_duration = "PT8H"

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_ssoadmin_managed_policy_attachment" "read_only" {
  instance_arn       = local.sso_instance_arn
  permission_set_arn = aws_ssoadmin_permission_set.read_only.arn
  managed_policy_arn = "arn:aws:iam::aws:policy/ReadOnlyAccess"
}

# ── Groups ───────────────────────────────────────────────────────────────────

resource "aws_identitystore_group" "admins" {
  identity_store_id = local.identity_store_id
  display_name      = "Admins"
  description       = "Full administrator access"
}

resource "aws_identitystore_group" "members" {
  identity_store_id = local.identity_store_id
  display_name      = "Members"
  description       = "Read-only access — add new SSO users to this group"
}

# ── Users ────────────────────────────────────────────────────────────────────

resource "aws_identitystore_user" "eric" {
  identity_store_id = local.identity_store_id

  display_name = "Eric"
  user_name    = "eric"

  name {
    given_name  = "Eric"
    family_name = "L"
  }

  emails {
    value   = var.admin_email
    primary = true
  }
}

resource "aws_identitystore_group_membership" "eric_admins" {
  identity_store_id = local.identity_store_id
  group_id          = aws_identitystore_group.admins.group_id
  member_id         = aws_identitystore_user.eric.user_id
}

# ── Account Assignments (management account) ─────────────────────────────────

resource "aws_ssoadmin_account_assignment" "admins_management" {
  instance_arn       = local.sso_instance_arn
  permission_set_arn = aws_ssoadmin_permission_set.administrator.arn

  principal_id   = aws_identitystore_group.admins.group_id
  principal_type = "GROUP"

  target_id   = data.aws_caller_identity.current.account_id
  target_type = "AWS_ACCOUNT"
}

resource "aws_ssoadmin_account_assignment" "members_management" {
  instance_arn       = local.sso_instance_arn
  permission_set_arn = aws_ssoadmin_permission_set.read_only.arn

  principal_id   = aws_identitystore_group.members.group_id
  principal_type = "GROUP"

  target_id   = data.aws_caller_identity.current.account_id
  target_type = "AWS_ACCOUNT"
}

# ── Account Assignments (Lantern Lounge member account) ───────────────────────
# Uncomment after the member account is created (tofu apply organizations.tf first)

# resource "aws_ssoadmin_account_assignment" "admins_lantern_lounge" {
#   instance_arn       = local.sso_instance_arn
#   permission_set_arn = aws_ssoadmin_permission_set.administrator.arn
#   principal_id       = aws_identitystore_group.admins.group_id
#   principal_type     = "GROUP"
#   target_id          = aws_organizations_account.lantern_lounge.id
#   target_type        = "AWS_ACCOUNT"
# }
#
# resource "aws_ssoadmin_account_assignment" "members_lantern_lounge" {
#   instance_arn       = local.sso_instance_arn
#   permission_set_arn = aws_ssoadmin_permission_set.read_only.arn
#   principal_id       = aws_identitystore_group.members.group_id
#   principal_type     = "GROUP"
#   target_id          = aws_organizations_account.lantern_lounge.id
#   target_type        = "AWS_ACCOUNT"
# }
