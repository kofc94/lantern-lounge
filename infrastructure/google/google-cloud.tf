# Google Cloud project under eledonne-org
resource "google_project" "lantern_lounge" {
  name       = "Lantern Lounge"
  project_id = var.google_project_id
  org_id     = var.google_org_id
}

# Enable required APIs
resource "google_project_service" "iap" {
  project            = google_project.lantern_lounge.project_id
  service            = "iap.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "serviceusage" {
  project            = google_project.lantern_lounge.project_id
  service            = "serviceusage.googleapis.com"
  disable_on_destroy = false
}


# Service account for Terraform CI
resource "google_service_account" "terraform_ci" {
  account_id   = "terraform-ci"
  display_name = "Terraform CI"
  project      = google_project.lantern_lounge.project_id
}

resource "google_project_iam_member" "terraform_ci_iap_admin" {
  project = google_project.lantern_lounge.project_id
  role    = "roles/iap.admin"
  member  = "serviceAccount:${google_service_account.terraform_ci.email}"
}

resource "google_project_iam_member" "terraform_ci_serviceusage_admin" {
  project = google_project.lantern_lounge.project_id
  role    = "roles/serviceusage.serviceUsageAdmin"
  member  = "serviceAccount:${google_service_account.terraform_ci.email}"
}

resource "google_organization_iam_member" "terraform_ci_project_creator" {
  org_id = var.google_org_id
  role   = "roles/resourcemanager.projectCreator"
  member = "serviceAccount:${google_service_account.terraform_ci.email}"
}

# Create a key and store it in SSM so GitHub Actions can use it
resource "google_service_account_key" "terraform_ci" {
  service_account_id = google_service_account.terraform_ci.name
}

resource "aws_ssm_parameter" "google_service_account_key" {
  name  = "/lantern-lounge/google/service-account-key"
  type  = "SecureString"
  value = base64decode(google_service_account_key.terraform_ci.private_key)
}
