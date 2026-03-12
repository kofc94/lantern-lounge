output "google_project_id" {
  description = "Google Cloud project ID"
  value       = google_project.lantern_lounge.project_id
}

output "google_project_number" {
  description = "Google Cloud project number"
  value       = google_project.lantern_lounge.number
}

output "terraform_ci_service_account_email" {
  description = "Email of the Terraform CI service account"
  value       = google_service_account.terraform_ci.email
}
