variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "cors_origins" {
  description = "Allowed CORS origins for S3 uploads"
  type        = list(string)
  default     = ["http://localhost:3000"]
}
