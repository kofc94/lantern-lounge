.PHONY: build test deploy

# Initialize OpenTofu
build:
	tofu init -input=false

# Plan infrastructure changes
test:
	tofu plan -input=false

# Apply infrastructure changes
deploy:
	tofu apply -input=false -auto-approve

# Only sensitive values go in terraform.tfvars (gitignored):
#   certificate_pem = "-----BEGIN CERTIFICATE-----\n..."
# Everything else (team_id, pass_type_id) is hardcoded in variables.tf.
