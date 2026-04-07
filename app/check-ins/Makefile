.PHONY: build test deploy

# Initialize OpenTofu/Terraform
build:
	tofu init -input=false

# Plan infrastructure changes
test:
	tofu plan -input=false

# Apply infrastructure changes
deploy:
	tofu apply -input=false -auto-approve

# Note: This app requires Cognito outputs from the cognito workspace.
# Ensure that the S3 backend for the cognito state is accessible.
