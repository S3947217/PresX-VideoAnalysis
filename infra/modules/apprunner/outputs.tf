output "service_url" {
  description = "App Runner service URL"
  value       = aws_apprunner_service.web.service_url
}

output "service_arn" {
  description = "App Runner service ARN"
  value       = aws_apprunner_service.web.arn
}

output "ecr_repository_url" {
  description = "ECR repository URL"
  value       = aws_ecr_repository.web.repository_url
}

output "custom_domain_validation_records" {
  description = "CNAME records to add in GoDaddy for App Runner custom domain"
  value       = aws_apprunner_custom_domain_association.web.certificate_validation_records
}
