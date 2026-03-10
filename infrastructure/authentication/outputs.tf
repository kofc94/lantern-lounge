output "google_identity_provider_name" {
  description = "Name of the Google identity provider"
  value       = aws_cognito_identity_provider.google.provider_name
}

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = tolist(data.aws_cognito_user_pools.existing.ids)[0]
}

output "google_project_id" {
  description = "Google Cloud project ID"
  value       = google_project.lantern_lounge.project_id
}

output "google_project_number" {
  description = "Google Cloud project number"
  value       = google_project.lantern_lounge.number
}
