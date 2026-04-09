terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
  }

  backend "s3" {
    bucket = "lanternlounge-tfstate"
    key    = "apple/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = "us-east-1"
}

# RSA-2048 private key for signing passes.
# Generated once and stored in SSM. Never changes after first apply.
resource "tls_private_key" "pass_signing" {
  algorithm = "RSA"
  rsa_bits  = 2048

  lifecycle {
    # Replacing this key would invalidate all existing passes.
    prevent_destroy = true
  }
}

# CSR to upload to Apple Developer → Certificates → Pass Type ID Certificate.
resource "tls_cert_request" "pass_signing" {
  private_key_pem = tls_private_key.pass_signing.private_key_pem

  subject {
    common_name  = var.pass_type_id
    organization = "The Lantern Lounge"
    country      = "US"
  }
}

# Download Apple's public WWDR G4 intermediate certificate and store it in SSM.
# Re-runs only if the URL trigger changes (i.e. Apple releases a new CA cert).
resource "null_resource" "wwdr_cert" {
  triggers = {
    cert_url = "https://www.apple.com/certificateauthority/AppleWWDRCAG4.cer"
  }

  provisioner "local-exec" {
    command = <<-EOT
      CERT=$(curl -sf https://www.apple.com/certificateauthority/AppleWWDRCAG4.cer \
               | openssl x509 -inform DER -outform PEM)
      aws ssm put-parameter \
        --name "/lantern-lounge/apple/wallet-wwdr-cert" \
        --value "$CERT" \
        --type String \
        --overwrite \
        --region us-east-1
    EOT
  }
}
