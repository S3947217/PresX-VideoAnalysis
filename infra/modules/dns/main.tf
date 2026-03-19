# ACM cert for presx.tech + www.presx.tech (App Runner custom domain)
resource "aws_acm_certificate" "web" {
  domain_name               = var.domain_name
  subject_alternative_names = ["www.${var.domain_name}"]
  validation_method         = "DNS"

  tags = {
    Project     = var.project_name
    Environment = var.environment
  }

  lifecycle {
    create_before_destroy = true
  }
}
