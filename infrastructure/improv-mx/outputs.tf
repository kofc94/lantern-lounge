output "mx_record_name" {
  description = "The MX record name"
  value       = aws_route53_record.mx.name
}

output "mx_record_fqdn" {
  description = "The MX record FQDN"
  value       = aws_route53_record.mx.fqdn
}
