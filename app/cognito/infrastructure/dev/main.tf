terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket = "lanternlounge-tfstate"
    key    = "app/cognito/dev/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
}

provider "google" {
  project = "lantern-lounge"
  region  = "us-central1"
}

module "cognito" {
  source = "../../"

  environment     = "dev"
  project_name    = var.project_name
  domain_name     = "dev.lanternlounge.org"
  www_domain_name = "www.dev.lanternlounge.org"
}
