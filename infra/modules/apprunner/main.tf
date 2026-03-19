resource "aws_ecr_repository" "web" {
  name                 = "${var.project_name}-${var.environment}-web"
  image_tag_mutability = "MUTABLE"
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}

# IAM role for App Runner to access ECR
resource "aws_iam_role" "apprunner_ecr" {
  name = "${var.project_name}-${var.environment}-apprunner-ecr"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "build.apprunner.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_iam_role_policy_attachment" "apprunner_ecr" {
  role       = aws_iam_role.apprunner_ecr.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess"
}

# IAM role for App Runner instance
resource "aws_iam_role" "apprunner_instance" {
  name = "${var.project_name}-${var.environment}-apprunner-instance"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "tasks.apprunner.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_iam_role_policy" "apprunner_instance" {
  name = "${var.project_name}-${var.environment}-apprunner-secrets"
  role = aws_iam_role.apprunner_instance.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = var.secret_arn
      },
      {
        Effect = "Allow"
        Action = [
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_apprunner_service" "web" {
  service_name = "${var.project_name}-${var.environment}-web"

  source_configuration {
    authentication_configuration {
      access_role_arn = aws_iam_role.apprunner_ecr.arn
    }

    image_repository {
      image_configuration {
        port = "3000"
        runtime_environment_variables = {
          NODE_ENV                            = "production"
          PORT                                = "3000"
          HOSTNAME                            = "0.0.0.0"
          COGNITO_USER_POOL_ID                = var.cognito_user_pool_id
          COGNITO_CLIENT_ID                   = var.cognito_client_id
          API_GATEWAY_URL                     = var.api_gateway_url
          NEXT_PUBLIC_STRIPE_KEY              = var.stripe_publishable_key
          NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID = var.stripe_monthly_price_id
          NEXT_PUBLIC_STRIPE_ANNUAL_PRICE_ID  = var.stripe_annual_price_id
          ADALO_API_KEY                       = var.adalo_api_key
          ADALO_APP_ID                        = var.adalo_app_id
          ADALO_USERS_COLLECTION_ID           = var.adalo_users_collection_id
        }
      }

      image_identifier      = "${aws_ecr_repository.web.repository_url}:latest"
      image_repository_type = "ECR"
    }

    auto_deployments_enabled = true
  }

  instance_configuration {
    cpu               = "256"
    memory            = "512"
    instance_role_arn = aws_iam_role.apprunner_instance.arn
  }

  health_check_configuration {
    protocol            = "TCP"
    interval            = 5
    timeout             = 5
    healthy_threshold   = 1
    unhealthy_threshold = 5
  }

  auto_scaling_configuration_arn = aws_apprunner_auto_scaling_configuration_version.web.arn

  observability_configuration {
    observability_enabled                  = true
    observability_configuration_arn = aws_apprunner_observability_configuration.xray.arn
  }

  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_apprunner_observability_configuration" "xray" {
  observability_configuration_name = "${var.project_name}-${var.environment}-xray"

  trace_configuration {
    vendor = "AWSXRAY"
  }

  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_apprunner_auto_scaling_configuration_version" "web" {
  auto_scaling_configuration_name = "${var.project_name}-${var.environment}-web"
  min_size                        = 1
  max_size                        = 2
  max_concurrency                 = 100

  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}

# Uncomment and configure when you have a custom domain
# resource "aws_apprunner_custom_domain_association" "web" {
#   domain_name = var.domain_name
#   service_arn = aws_apprunner_service.web.arn
# }
