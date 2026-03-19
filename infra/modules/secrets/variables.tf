variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Deployment environment"
  type        = string
}

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
