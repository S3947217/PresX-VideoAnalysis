output "table_name" {
  description = "DynamoDB table name"
  value       = aws_dynamodb_table.projects.name
}

output "table_arn" {
  description = "DynamoDB table ARN"
  value       = aws_dynamodb_table.projects.arn
}

output "coupons_table_name" {
  description = "DynamoDB coupons table name"
  value       = aws_dynamodb_table.coupons.name
}

output "coupons_table_arn" {
  description = "DynamoDB coupons table ARN"
  value       = aws_dynamodb_table.coupons.arn
}
