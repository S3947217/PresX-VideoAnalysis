output "web_cert_arn" {
  description = "ACM certificate ARN for web domain"
  value       = aws_acm_certificate.web.arn
}

output "web_cert_validation" {
  description = "CNAME records to add in GoDaddy for web cert validation"
  value = [for dvo in aws_acm_certificate.web.domain_validation_options : {
    name  = dvo.resource_record_name
    type  = dvo.resource_record_type
    value = dvo.resource_record_value
  }]
}
