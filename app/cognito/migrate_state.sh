#!/bin/bash
set -e

# Migrate Cognito state to new structure
BACKUP_FILE="old_cognito.tfstate"
OLD_KEY="authentication/terraform.tfstate"
MODULE_NAME="cognito"

echo "Step 1: Pulling old state from S3..."
cat <<EOF > temp_backend.tf
terraform {
  backend "s3" {
    bucket = "lanternlounge-tfstate"
    key    = "$OLD_KEY"
    region = "us-east-1"
  }
}
EOF

tofu init -reconfigure -input=false
tofu state pull > "$BACKUP_FILE"
rm temp_backend.tf
rm -rf .terraform .terraform.lock.hcl

# Step 2: Migrating resources into module.$MODULE_NAME...
cd infrastructure/prod
tofu init -reconfigure -input=false

for res in $(tofu state list -state="../../$BACKUP_FILE" | grep -v "^data\."); do
  if tofu state list | grep -q "^module.$MODULE_NAME.$res$"; then
    echo "  [Skip] $res already migrated."
  else
    echo "  [Move] $res -> module.$MODULE_NAME.$res"
    tofu state mv -state="../../$BACKUP_FILE" "$res" "module.$MODULE_NAME.$res"
  fi
done

echo "Migration complete! Verifying..."
tofu plan
