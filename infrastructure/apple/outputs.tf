output "csr_pem" {
  value       = tls_cert_request.pass_signing.cert_request_pem
  sensitive   = true
  description = "Upload this CSR to Apple Developer to obtain your Pass Type ID Certificate"
}

output "pass_type_id" {
  value       = aws_ssm_parameter.pass_type_id.value
  sensitive   = true
  description = "Apple Wallet Pass Type ID"
}
