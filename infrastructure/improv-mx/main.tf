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
    key    = "improv-mx/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = "us-east-1"
}

data "aws_route53_zone" "main" {
  zone_id      = "Z06321901A5NMQ9WCA76Y"
  private_zone = false
}

# ImprovMX MX records for lanternlounge.org
resource "aws_route53_record" "mx" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "lanternlounge.org"
  type    = "MX"
  ttl     = 300

  records = [
    "10 mx1.improvmx.com",
    "20 mx2.improvmx.com",
  ]
}

# SPF record — authorizes ImprovMX to send on behalf of the domain
resource "aws_route53_record" "spf" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "lanternlounge.org"
  type    = "TXT"
  ttl     = 300

  records = [
    "v=spf1 include:spf.improvmx.com ~all",
  ]
}
