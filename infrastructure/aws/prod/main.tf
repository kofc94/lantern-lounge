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

# The DNS provider manages the Route53 Hosted Zone in the management account
provider "aws" {
  alias  = "mgt"
  region = var.aws_region
}

data "terraform_remote_state" "global" {
  backend = "s3"
  config = {
    bucket = "lanternlounge-tfstate"
    key    = "infrastructure/aws/global/terraform.tfstate"
    region = "us-east-1"
  }
}

module "website" {
  source = "../base/website"

  environment         = "production"
  project_name        = var.project_name
  domain_name         = "lanternlounge.org"
  route53_zone_id     = data.terraform_remote_state.global.outputs.route53_zone_id
  www_domain_name     = "www.lanternlounge.org"
  checkin_domain_name = "checkin.lanternlounge.org"

  # For the existing Production environment, we use the management account provider
  # for all resources to match the existing deployment.
  providers = {
    aws           = aws.mgt
    aws.us_east_1 = aws.mgt
    aws.dns       = aws.mgt
  }
}
