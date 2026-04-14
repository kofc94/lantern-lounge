terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

data "terraform_remote_state" "cognito" {
  backend = "s3"
  config = {
    bucket = "lanternlounge-tfstate"
    key    = "app/cognito/${var.environment}/terraform.tfstate"
    region = "us-east-1"
  }
}

data "terraform_remote_state" "infrastructure" {
  backend = "s3"
  config = {
    bucket = "lanternlounge-tfstate"
    key    = "infrastructure/aws/${var.environment}/terraform.tfstate"
    region = "us-east-1"
  }
}
