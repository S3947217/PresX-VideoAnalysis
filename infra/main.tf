terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "presx-tfstate-ap-southeast-2"
    key            = "presx/terraform.tfstate"
    region         = "ap-southeast-2"
    dynamodb_table = "presx-tfstate-ap-southeast-2-lock"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region
}

module "cognito" {
  source       = "./modules/cognito"
  project_name = var.project_name
  environment  = var.environment
}

module "secrets" {
  source       = "./modules/secrets"
  project_name = var.project_name
  environment  = var.environment

  openai_api_key            = var.openai_api_key
  stripe_secret_key         = var.stripe_secret_key
  stripe_webhook_secret     = var.stripe_webhook_secret
  stripe_publishable_key    = var.stripe_publishable_key
  adalo_api_key             = var.adalo_api_key
  adalo_app_id              = var.adalo_app_id
  adalo_users_collection_id = var.adalo_users_collection_id
}

module "dynamodb" {
  source       = "./modules/dynamodb"
  project_name = var.project_name
  environment  = var.environment
}

module "s3_audio" {
  source       = "./modules/s3-audio"
  project_name = var.project_name
  environment  = var.environment
  cors_origins = var.cors_origins
}

module "s3_assets" {
  source       = "./modules/s3-assets"
  project_name = var.project_name
  environment  = var.environment
}

module "lambda" {
  source       = "./modules/lambda"
  project_name = var.project_name
  environment  = var.environment

  table_name          = module.dynamodb.table_name
  table_arn           = module.dynamodb.table_arn
  coupons_table_name  = module.dynamodb.coupons_table_name
  coupons_table_arn   = module.dynamodb.coupons_table_arn
  bucket_name         = module.s3_audio.bucket_name
  bucket_arn          = module.s3_audio.bucket_arn
  secret_name         = module.secrets.secret_name
  secret_arn          = module.secrets.secret_arn
}

module "apigateway" {
  source       = "./modules/apigateway"
  project_name = var.project_name
  environment  = var.environment

  lambda_function_name = module.lambda.function_name
  lambda_function_arn  = module.lambda.function_arn
  lambda_invoke_arn    = module.lambda.invoke_arn
  cognito_user_pool_id = module.cognito.user_pool_id
  cognito_client_id    = module.cognito.user_pool_client_id
  cors_origins         = var.cors_origins
}

module "dns" {
  source       = "./modules/dns"
  project_name = var.project_name
  environment  = var.environment
  domain_name  = var.domain_name
}

module "apprunner" {
  source       = "./modules/apprunner"
  project_name = var.project_name
  environment  = var.environment
  domain_name  = var.domain_name

  cognito_user_pool_id = module.cognito.user_pool_id
  cognito_client_id    = module.cognito.user_pool_client_id
  api_gateway_url      = module.apigateway.api_endpoint
  secret_arn           = module.secrets.secret_arn
  stripe_publishable_key  = var.stripe_publishable_key
  stripe_monthly_price_id = var.stripe_monthly_price_id
  stripe_annual_price_id  = var.stripe_annual_price_id
  adalo_api_key             = var.adalo_api_key
  adalo_app_id              = var.adalo_app_id
  adalo_users_collection_id = var.adalo_users_collection_id
}
