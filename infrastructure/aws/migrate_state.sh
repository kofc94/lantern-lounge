#!/bin/bash
set -e

# Comprehensive Migration Script (Exhaustive Version)
# This script moves every existing physical resource into the new module-based state.

BACKUP_FILE="old_state.tfstate"
CALENDAR_BACKUP="old_calendar.tfstate"

cd "$(dirname "$0")"

echo "Step 1: Pulling latest states from S3..."
# Pull main infrastructure state
if [ ! -f "$BACKUP_FILE" ]; then
  cat <<EOF > temp_infra.tf
terraform { backend "s3" { bucket = "lanternlounge-tfstate"; key = "terraform.tfstate"; region = "us-east-1" } }
EOF
  tofu init -reconfigure -input=false
  tofu state pull > "$BACKUP_FILE"
  rm temp_infra.tf
  rm -rf .terraform .terraform.lock.hcl
fi

# Pull calendar state
if [ ! -f "$CALENDAR_BACKUP" ]; then
  cat <<EOF > temp_cal.tf
terraform { backend "s3" { bucket = "lanternlounge-tfstate"; key = "app/terraform.tfstate"; region = "us-east-1" } }
EOF
  tofu init -reconfigure -input=false
  tofu state pull > "$CALENDAR_BACKUP"
  rm temp_cal.tf
  rm -rf .terraform .terraform.lock.hcl
fi

# Function to safely move state
safe_mv() {
  local s_state=$1; local s_addr=$2; local t_addr=$3
  if tofu state list | grep -q "^${t_addr}$"; then
    echo "  [Skip] $t_addr already exists."
  elif ! tofu state list -state="$s_state" | grep -q "^${s_addr}$"; then
    echo "  [Warn] $s_addr not found in source state."
  else
    echo "  [Move] $s_addr -> $t_addr"
    tofu state mv -state="$s_state" "$s_addr" "$t_addr"
  fi
}

echo "Step 2: Migrating Global State..."
cd global
tofu init -reconfigure -input=false

# Route53 Zone (Managed resource now)
if ! tofu state list | grep -q "aws_route53_zone.main"; then
  echo "  [Import] aws_route53_zone.main"
  tofu import aws_route53_zone.main Z06321901A5NMQ9WCA76Y || true
fi

# Organizations & SSO & OIDC
safe_mv "../$BACKUP_FILE" "aws_organizations_organization.main" "aws_organizations_organization.main"
safe_mv "../$BACKUP_FILE" "aws_organizations_account.lantern_lounge" "aws_organizations_account.prod"
safe_mv "../$BACKUP_FILE" "aws_identitystore_group.admins" "aws_identitystore_group.admins"
safe_mv "../$BACKUP_FILE" "aws_identitystore_group.members" "aws_identitystore_group.members"
safe_mv "../$BACKUP_FILE" "aws_identitystore_user.eric" "aws_identitystore_user.eric"
safe_mv "../$BACKUP_FILE" "aws_identitystore_group_membership.eric_admins" "aws_identitystore_group_membership.eric_admins"
safe_mv "../$BACKUP_FILE" "aws_ssoadmin_permission_set.administrator" "aws_ssoadmin_permission_set.administrator"
safe_mv "../$BACKUP_FILE" "aws_ssoadmin_permission_set.billing" "aws_ssoadmin_permission_set.billing"
safe_mv "../$BACKUP_FILE" "aws_ssoadmin_permission_set.read_only" "aws_ssoadmin_permission_set.read_only"
safe_mv "../$BACKUP_FILE" "aws_ssoadmin_managed_policy_attachment.administrator" "aws_ssoadmin_managed_policy_attachment.administrator"
safe_mv "../$BACKUP_FILE" "aws_ssoadmin_managed_policy_attachment.billing" "aws_ssoadmin_managed_policy_attachment.billing"
safe_mv "../$BACKUP_FILE" "aws_ssoadmin_managed_policy_attachment.read_only" "aws_ssoadmin_managed_policy_attachment.read_only"
safe_mv "../$BACKUP_FILE" "aws_ssoadmin_account_assignment.admins_management" "aws_ssoadmin_account_assignment.admins_management"
safe_mv "../$BACKUP_FILE" "aws_ssoadmin_account_assignment.eric_billing" "aws_ssoadmin_account_assignment.eric_billing"
safe_mv "../$BACKUP_FILE" "aws_ssoadmin_account_assignment.members_management" "aws_ssoadmin_account_assignment.members_management"
safe_mv "../$BACKUP_FILE" "aws_iam_openid_connect_provider.github" "aws_iam_openid_connect_provider.github"
safe_mv "../$BACKUP_FILE" "aws_iam_role.github_actions_terraform" "aws_iam_role.github_actions_terraform"
safe_mv "../$BACKUP_FILE" "aws_iam_role_policy.github_actions_terraform" "aws_iam_role_policy.github_actions_terraform"

# Complex resource (Map the list)
for policy in $(tofu state list -state="../$BACKUP_FILE" | grep "aws_iam_role_policy_attachment.github_actions_terraform"); do
  safe_mv "../$BACKUP_FILE" "$policy" "$policy"
done

echo "Step 3: Migrating Production State..."
cd ../prod
tofu init -reconfigure -input=false

# API Gateway (Moved from Calendar)
safe_mv "../$CALENDAR_BACKUP" "aws_apigatewayv2_api.calendar_api" "module.website.aws_apigatewayv2_api.main"
safe_mv "../$CALENDAR_BACKUP" "aws_apigatewayv2_stage.default" "module.website.aws_apigatewayv2_stage.default"
safe_mv "../$CALENDAR_BACKUP" "aws_cloudwatch_log_group.api_gateway_logs" "module.website.aws_cloudwatch_log_group.api_gateway_logs"

# Cost allocation tags
safe_mv "../$BACKUP_FILE" "aws_ce_cost_allocation_tag.environment" "module.website.aws_ce_cost_allocation_tag.environment"
safe_mv "../$BACKUP_FILE" "aws_ce_cost_allocation_tag.project" "module.website.aws_ce_cost_allocation_tag.project"

# CloudFront
safe_mv "../$BACKUP_FILE" "aws_cloudfront_origin_access_control.s3_oac" "module.website.aws_cloudfront_origin_access_control.s3_oac"
safe_mv "../$BACKUP_FILE" "aws_cloudfront_distribution.website_distribution" "module.website.aws_cloudfront_distribution.website_distribution"
safe_mv "../$BACKUP_FILE" "aws_cloudfront_distribution.redirect_distribution" "module.website.aws_cloudfront_distribution.redirect_distribution"
safe_mv "../$BACKUP_FILE" "aws_cloudfront_function.redirect_to_www" "module.website.aws_cloudfront_function.redirect_to_www"
safe_mv "../$BACKUP_FILE" "aws_cloudfront_distribution.checkin_distribution" "module.website.aws_cloudfront_distribution.checkin_distribution"

# ACM & Validation
safe_mv "../$BACKUP_FILE" "aws_acm_certificate.ssl_certificate" "module.website.aws_acm_certificate.ssl_certificate"
safe_mv "../$BACKUP_FILE" "aws_acm_certificate.checkin_certificate" "module.website.aws_acm_certificate.checkin_certificate"
safe_mv "../$BACKUP_FILE" "aws_acm_certificate_validation.ssl_validation" "module.website.aws_acm_certificate_validation.ssl_validation"
safe_mv "../$BACKUP_FILE" "aws_acm_certificate_validation.checkin_ssl_validation" "module.website.aws_acm_certificate_validation.checkin_ssl_validation"

# S3 Buckets & Config
safe_mv "../$BACKUP_FILE" "aws_s3_bucket.website" "module.website.aws_s3_bucket.website"
safe_mv "../$BACKUP_FILE" "aws_s3_bucket.redirect" "module.website.aws_s3_bucket.redirect"
safe_mv "../$BACKUP_FILE" "aws_s3_bucket_public_access_block.website" "module.website.aws_s3_bucket_public_access_block.website"
safe_mv "../$BACKUP_FILE" "aws_s3_bucket_public_access_block.redirect" "module.website.aws_s3_bucket_public_access_block.redirect"
safe_mv "../$BACKUP_FILE" "aws_s3_bucket_website_configuration.website" "module.website.aws_s3_bucket_website_configuration.website"
safe_mv "../$BACKUP_FILE" "aws_s3_bucket_website_configuration.redirect" "module.website.aws_s3_bucket_website_configuration.redirect"

# Route53 Records
safe_mv "../$BACKUP_FILE" "aws_route53_record.www" "module.website.aws_route53_record.www"
safe_mv "../$BACKUP_FILE" "aws_route53_record.www_ipv6" "module.website.aws_route53_record.www_ipv6"
safe_mv "../$BACKUP_FILE" "aws_route53_record.root" "module.website.aws_route53_record.root"
safe_mv "../$BACKUP_FILE" "aws_route53_record.root_ipv6" "module.website.aws_route53_record.root_ipv6"
safe_mv "../$BACKUP_FILE" "aws_route53_record.checkin" "module.website.aws_route53_record.checkin"
safe_mv "../$BACKUP_FILE" "aws_route53_record.checkin_ipv6" "module.website.aws_route53_record.checkin_ipv6"

# Indexed Route53 Records
safe_mv "../$BACKUP_FILE" "aws_route53_record.checkin_ssl_validation[\"checkin.lanternlounge.org\"]" "module.website.aws_route53_record.checkin_ssl_validation[\"checkin.lanternlounge.org\"]"
safe_mv "../$BACKUP_FILE" "aws_route53_record.ssl_validation[\"lanternlounge.org\"]" "module.website.aws_route53_record.ssl_validation[\"lanternlounge.org\"]"
safe_mv "../$BACKUP_FILE" "aws_route53_record.ssl_validation[\"www.lanternlounge.org\"]" "module.website.aws_route53_record.ssl_validation[\"www.lanternlounge.org\"]"

echo "Migration complete! Verifying production plan..."
tofu plan
