output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = module.cognito.user_pool_id
}

output "cognito_client_id" {
  description = "Cognito App Client ID"
  value       = module.cognito.user_pool_client_id
}

# DynamoDB
output "dynamodb_table_name" {
  description = "DynamoDB projects table name"
  value       = module.dynamodb.table_name
}

output "dynamodb_table_arn" {
  description = "DynamoDB projects table ARN"
  value       = module.dynamodb.table_arn
}

# S3
output "s3_bucket_name" {
  description = "S3 audio uploads bucket name"
  value       = module.s3_audio.bucket_name
}

output "s3_bucket_arn" {
  description = "S3 audio uploads bucket ARN"
  value       = module.s3_audio.bucket_arn
}

# Secrets
output "secret_arn" {
  description = "Secrets Manager secret ARN"
  value       = module.secrets.secret_arn
}

output "secret_name" {
  description = "Secrets Manager secret name"
  value       = module.secrets.secret_name
}

# Lambda
output "lambda_function_name" {
  description = "Lambda function name"
  value       = module.lambda.function_name
}

output "lambda_function_arn" {
  description = "Lambda function ARN"
  value       = module.lambda.function_arn
}

# API Gateway
output "api_gateway_endpoint" {
  description = "API Gateway endpoint URL"
  value       = module.apigateway.api_endpoint
}

output "api_gateway_id" {
  description = "API Gateway ID"
  value       = module.apigateway.api_id
}

# DNS / Certs
# output "web_cert_validation" {
#   description = "CNAME records to add in GoDaddy for web cert"
#   value       = module.dns.web_cert_validation
# }



# App Runner
# output "apprunner_service_url" {
#   description = "App Runner service URL"
#   value       = module.apprunner.service_url
# }

# output "ecr_repository_url" {
#   description = "ECR repository URL"
#   value       = module.apprunner.ecr_repository_url
# }

# output "apprunner_domain_validation" {
#   description = "CNAME records for App Runner custom domain (add in GoDaddy)"
#   value       = module.apprunner.custom_domain_validation_records
# }
