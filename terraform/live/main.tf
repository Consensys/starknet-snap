#############
## DNS
#############

locals {
  # snaps 
  snaps_hosted_zone_name_new    = "snaps.consensys.io"
  dev_snaps_domain_name_new     = "dev.${local.snaps_hosted_zone_name_new}"
  snaps_cert_new                = "arn:aws:acm:us-east-1:905502874957:certificate/9a317fa9-baef-47b8-8814-f387ae646afc"
  staging_snaps_domain_name_new = "staging.${local.snaps_hosted_zone_name_new}"
  prod_snaps_domain_name_new    = local.snaps_hosted_zone_name_new

  #cloudfront functions
  cloudfront_functions = {
    redirect = {
      arn        = aws_cloudfront_function.starknet_redirect.arn
      event_type = "viewer-request"
    }
    headers = {
      arn        = aws_cloudfront_function.starknet_add_header.arn
      event_type = "viewer-response"
    }
  }
}

#############
## Cloufront configurations
#############

resource "aws_cloudfront_function" "starknet_redirect" {
  name    = "starknet-snap-redirect"
  runtime = "cloudfront-js-1.0"
  comment = "starknet-snap-redirect"
  publish = true
  code    = file("${path.module}/functions/redirect-mm.js")
}

resource "aws_cloudfront_function" "starknet_add_header" {
  name    = "starknet-snap-add-header"
  runtime = "cloudfront-js-1.0"
  comment = "starknet-snap-add-header"
  publish = true
  code    = file("${path.module}/functions/headers.js")
}


#############
## Dev
#############
module "s3_snaps_page_dev_new" {
  source = "../modules/aws-s3-website-no-r53"

  bucket_name          = local.dev_snaps_domain_name_new
  domain_name          = local.dev_snaps_domain_name_new
  certificate_arn      = local.snaps_cert_new
  cloudfront_functions = local.cloudfront_functions
  tags                 = module.tags.common
}

#############
## Staging
#############
module "s3_snaps_page_staging_new" {
  source = "../modules/aws-s3-website-no-r53"

  bucket_name          = local.staging_snaps_domain_name_new
  domain_name          = local.staging_snaps_domain_name_new
  certificate_arn      = local.snaps_cert_new
  cloudfront_functions = local.cloudfront_functions
  tags                 = module.tags.common
}
#############
## Prod
#############
module "s3_snaps_page_prod_new" {
  source = "../modules/aws-s3-website-no-r53"

  bucket_name          = local.prod_snaps_domain_name_new
  domain_name          = local.prod_snaps_domain_name_new
  certificate_arn      = local.snaps_cert_new
  cloudfront_functions = local.cloudfront_functions
  tags                 = module.tags.common

  cache_policy_id            = "658327ea-f89d-4fab-a63d-7e88639e58f6" # Managed-CachingOptimized
  origin_request_policy_id   = "88a5eaf4-2fd4-4709-b370-b4c650ea3fcf" # Managed-CORS-S3Origin
  response_headers_policy_id = "5cc3b908-e619-4b99-88e5-2cf7f45965bd" # Managed-CORS-With-Preflight
}
