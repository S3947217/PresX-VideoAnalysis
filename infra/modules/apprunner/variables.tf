variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "domain_name" {
  description = "Root domain name"
  type        = string
}

variable "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  type        = string
}

variable "cognito_client_id" {
  description = "Cognito App Client ID"
  type        = string
}

variable "api_gateway_url" {
  description = "API Gateway endpoint URL"
  type        = string
}

variable "secret_arn" {
  description = "Secrets Manager secret ARN"
  type        = string
}

variable "stripe_publishable_key" {
  description = "Stripe publishable key"
  type        = string
  default     = ""
}

variable "stripe_monthly_price_id" {
  description = "Stripe monthly price ID for subscription"
  type        = string
  default     = ""
}

variable "stripe_annual_price_id" {
  description = "Stripe annual price ID for subscription"
  type        = string
  default     = ""
}

variable "adalo_api_key" {
  description = "Adalo API key"
  type        = string
  sensitive   = true
}

variable "adalo_app_id" {
  description = "Adalo app ID"
  type        = string
  sensitive   = true
}

variable "adalo_users_collection_id" {
  description = "Adalo users collection ID"
  type        = string
  sensitive   = true
}
