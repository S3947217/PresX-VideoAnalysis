resource "aws_secretsmanager_secret" "api_keys" {
  name        = "${var.project_name}-${var.environment}-api-keys"
  description = "API keys for ${var.project_name} ${var.environment}"

  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "api_keys" {
  secret_id = aws_secretsmanager_secret.api_keys.id

  secret_string = jsonencode({
    OPENAI_API_KEY              = var.openai_api_key
    STRIPE_SECRET_KEY           = var.stripe_secret_key
    STRIPE_WEBHOOK_SECRET       = var.stripe_webhook_secret
    STRIPE_PUBLISHABLE_KEY      = var.stripe_publishable_key
    ADALO_API_KEY               = var.adalo_api_key
    ADALO_APP_ID                = var.adalo_app_id
    ADALO_USERS_COLLECTION_ID   = var.adalo_users_collection_id
  })
}
