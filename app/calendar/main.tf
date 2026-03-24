terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket = "lanternlounge-tfstate"
    key    = "calendar/terraform.tfstate"
    region = "us-east-1"
  }
}

data "terraform_remote_state" "cognito" {
  backend = "s3"
  config = {
    bucket = "lanternlounge-tfstate"
    key    = "cognito/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
}

locals {
  domain_name     = "lanternlounge.org"
  www_domain_name = "www.lanternlounge.org"
}
