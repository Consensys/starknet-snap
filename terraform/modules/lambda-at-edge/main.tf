module "s3_artifact_bucket" {
  source        = "terraform-aws-modules/s3-bucket/aws"
  version       = "3.4.0"
  bucket        = var.bucket_name
  acl           = "private"
  force_destroy = true
  tags          = var.tags

  versioning = {
    enabled = true
  }

}

module "lambda" {
  source                 = "transcend-io/lambda-at-edge/aws"
  version                = "0.5.0"
  name                   = var.lambda_name
  description            = var.lambda_description
  runtime                = "nodejs16.x"
  lambda_code_source_dir = var.lambda_code_source_dir
  s3_artifact_bucket     = var.bucket_name
  file_globs             = ["**"]
  depends_on             = [module.s3_artifact_bucket]
}
