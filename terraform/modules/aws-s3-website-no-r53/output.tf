output "cf_domain_name" {
  value = aws_cloudfront_distribution.dist.domain_name
}

output "bucket_regional_domain_name" {
  value = aws_s3_bucket.bucket.bucket_regional_domain_name
}

output "bucket_arn" {
  value = aws_s3_bucket.bucket.arn
}

output "cf_arn" {
  value = aws_cloudfront_distribution.dist.arn
}
