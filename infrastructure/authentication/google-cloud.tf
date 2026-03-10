# Google Cloud project under eledonne-org
resource "google_project" "lantern_lounge" {
  name       = var.google_project_id
  project_id = var.google_project_id
  org_id     = var.google_org_id
}


