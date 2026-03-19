output "bucket_name" {
  value = aws_s3_bucket.assets.id
}

output "bucket_url" {
  value = "https://${aws_s3_bucket.assets.id}.s3.${aws_s3_bucket.assets.region}.amazonaws.com"
}
