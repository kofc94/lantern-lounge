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
    key    = "infrastructure/aws/prod/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
  assume_role {
    role_arn = "arn:aws:iam::${var.prod_account_id}:role/OrganizationAccountAccessRole"
  }
}

provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
  assume_role {
    role_arn = "arn:aws:iam::${var.prod_account_id}:role/OrganizationAccountAccessRole"
  }
}

module "website" {
  source = "../base/website"

  environment         = "production"
  project_name        = var.project_name
  domain_name         = "lanternlounge.org"
  www_domain_name     = "www.lanternlounge.org"
  checkin_domain_name = "checkin.lanternlounge.org"
  api_gateway_domain  = var.api_gateway_domain

  providers = {
    aws           = aws
    aws.us_east_1 = aws.us_east_1
  }
}
