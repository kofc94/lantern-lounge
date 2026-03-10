terraform {
  required_version = ">= 1.0"
  required_providers {
    github = {
      source  = "integrations/github"
      version = "~> 6.0"
    }
  }

  backend "s3" {
    bucket = "lanternlounge-tfstate"
    key    = "github/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "github" {
  owner = "kofc94"
}


resource "github_repository" "lantern_lounge" {
  name = "lantern-lounge"
  description = "Member Association Website, infra and software"
  has_downloads = true
  has_issues = true
  has_projects = true
}

resource "github_team" "devs" {
  name        = "devs"
  description = "Developers with repo access"
  privacy     = "closed"
}

resource "github_team_repository" "devs_repo_access" {
  team_id   = github_team.devs.id
  repository = github_repository.lantern_lounge.name
  permission = "push" # pull | push | maintain | admin
}

resource "github_team_membership" "eric" {
  team_id  = github_team.devs.id
  username = "eric-pierre"
  role     = "maintainer"
}

locals {
  dev_members = [
    # Add GitHub usernames here, e.g. "mjsalerno"
  ]
}

resource "github_team_membership" "members" {
  for_each = toset(local.dev_members)
  team_id  = github_team.devs.id
  username = each.value
  role     = "member"
}

resource "github_branch_protection" "main" {
  repository_id = github_repository.lantern_lounge.node_id
  pattern       = "main"

  # Prevent direct pushes — changes must go through a PR
  restrict_pushes {
    push_allowances = []
  }

  required_pull_request_reviews {
    required_approving_review_count = 1
    dismiss_stale_reviews           = true
  }
}