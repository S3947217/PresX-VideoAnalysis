variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "ap-southeast-2"
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "presx"
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "domain_name" {
  description = "Root domain name"
  type        = string
  default     = "presx.tech"
}

variable "cors_origins" {
  description = "Allowed CORS origins"
  type        = list(string)
  default     = ["http://localhost:3000"]
}

# Secrets — pass via -var flags, never commit
variable "openai_api_key" {
  description = "OpenAI API key"
  type        = string
  sensitive   = true
}

variable "stripe_secret_key" {
  description = "Stripe secret key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "stripe_webhook_secret" {
  description = "Stripe webhook signing secret"
  type        = string
  sensitive   = true
  default     = ""
}

variable "stripe_publishable_key" {
  description = "Stripe publishable key"
  type        = string
  sensitive   = true
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
  default     = ""
}

variable "adalo_app_id" {
  description = "Adalo app ID"
  type        = string
  sensitive   = true
  default     = ""
}

variable "adalo_users_collection_id" {
  description = "Adalo users collection ID"
  type        = string
  sensitive   = true
  default     = ""
}
