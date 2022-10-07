resource "aws_s3_bucket" "bucket" {
  bucket = var.bucket_name
  tags   = var.tags
}

resource "aws_s3_bucket_acl" "main" {
  bucket = aws_s3_bucket.bucket.id
  acl    = "private"
}

resource "aws_s3_bucket_versioning" "main_versioning" {
  bucket = aws_s3_bucket.bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

module "lambda" {
  source                 = "transcend-io/lambda-at-edge/aws"
  version                = "0.5.0"
  name                   = var.lambda_name
  description            = var.lambda_description
  runtime                = "nodejs16.x"
  lambda_code_source_dir = var.lambda_code_source_dir
  s3_artifact_bucket     = aws_s3_bucket.bucket.bucket
  file_globs             = ["**"]
}
