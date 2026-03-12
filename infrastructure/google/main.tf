terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket = "lanternlounge-tfstate"
    key    = "google/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "google" {}

provider "aws" {
  region = "us-east-1"
}
