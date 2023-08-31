#############
## DNS
#############

locals {
  hosted_zone_name                = "starknet-snap.consensys-solutions.net"
  hosted_zone_id                  = aws_route53_zone.main.zone_id
  dev_domain_name                 = "app-dev.${local.hosted_zone_name}"
  dev_domain_name_alternative     = "dev.snaps.consensys.io"
  staging_domain_name             = "app-staging.${local.hosted_zone_name}"
  staging_domain_name_alternative = "staging.snaps.consensys.io"
  prod_domain_name                = "app.${local.hosted_zone_name}"
  prod_domain_name_alternative    = "snaps.consensys.io"

  # snaps 
  snaps_hosted_zone_name        = "snaps.consensys.net"
  snaps_hosted_zone_name_new    = "snaps.consensys.io"
  snaps_hosted_zone_id          = aws_route53_zone.snaps.zone_id
  dev_snaps_domain_name         = "dev.${local.snaps_hosted_zone_name}"
  dev_snaps_domain_name_new     = "dev.${local.snaps_hosted_zone_name_new}"
  snaps_cert_new                = "arn:aws:acm:us-east-1:905502874957:certificate/9a317fa9-baef-47b8-8814-f387ae646afc"
  staging_snaps_domain_name     = "staging.${local.snaps_hosted_zone_name}"
  staging_snaps_domain_name_new = "staging.${local.snaps_hosted_zone_name_new}"
  prod_snaps_domain_name        = local.snaps_hosted_zone_name
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

resource "aws_route53_zone" "main" {
  name = local.hosted_zone_name
  tags = module.tags.common
}

resource "aws_route53_zone" "snaps" {
  name = local.snaps_hosted_zone_name
  tags = module.tags.common
}

#############
## Certificate
#############

module "cert" {
  source  = "terraform-aws-modules/acm/aws"
  version = "3.5.0"

  providers = {
    aws = aws.use1
  }

  subject_alternative_names = ["*.starknet-snap.consensys-solutions.net"]
  wait_for_validation       = true
  domain_name               = local.hosted_zone_name
  zone_id                   = local.hosted_zone_id
  tags                      = module.tags.common
}

module "snaps_cert" {
  source  = "terraform-aws-modules/acm/aws"
  version = "3.5.0"

  providers = {
    aws = aws.use1
  }

  subject_alternative_names = ["*.${local.snaps_hosted_zone_name}"]
  wait_for_validation       = true
  domain_name               = local.snaps_hosted_zone_name
  zone_id                   = local.snaps_hosted_zone_id
  tags                      = module.tags.common
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

module "s3_dev" {
  source = "../modules/aws-s3-website"

  bucket_name     = local.dev_domain_name
  domain_name     = local.dev_domain_name
  certificate_arn = module.cert.acm_certificate_arn
  cloudfront_functions = {
    headers = {
      arn        = aws_cloudfront_function.starknet_add_header.arn
      event_type = "viewer-response"
    }
  }
  hosted_zone_id = local.hosted_zone_id
  tags           = module.tags.common
}

module "s3_snaps_page_dev" {
  source = "../modules/aws-s3-website"

  bucket_name          = local.dev_snaps_domain_name
  domain_name          = local.dev_snaps_domain_name
  certificate_arn      = module.snaps_cert.acm_certificate_arn
  hosted_zone_id       = local.snaps_hosted_zone_id
  cloudfront_functions = local.cloudfront_functions
  tags                 = module.tags.common
}

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

module "s3_staging" {
  source = "../modules/aws-s3-website"

  bucket_name     = local.staging_domain_name
  domain_name     = local.staging_domain_name
  certificate_arn = module.cert.acm_certificate_arn
  hosted_zone_id  = local.hosted_zone_id
  cloudfront_functions = {
    headers = {
      arn        = aws_cloudfront_function.starknet_add_header.arn
      event_type = "viewer-response"
    }
  }
  tags = module.tags.common
}

module "s3_snaps_page_staging" {
  source = "../modules/aws-s3-website"

  bucket_name          = local.staging_snaps_domain_name
  domain_name          = local.staging_snaps_domain_name
  certificate_arn      = module.snaps_cert.acm_certificate_arn
  hosted_zone_id       = local.snaps_hosted_zone_id
  cloudfront_functions = local.cloudfront_functions
  tags                 = module.tags.common
}

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

module "s3_prod" {
  source = "../modules/aws-s3-website"

  bucket_name     = local.prod_domain_name
  domain_name     = local.prod_domain_name
  certificate_arn = module.cert.acm_certificate_arn
  hosted_zone_id  = local.hosted_zone_id
  cloudfront_functions = {
    headers = {
      arn        = aws_cloudfront_function.starknet_add_header.arn
      event_type = "viewer-response"
    }
  }
  tags = module.tags.common
}

module "s3_snaps_page_prod" {
  source = "../modules/aws-s3-website"

  bucket_name          = local.prod_snaps_domain_name
  domain_name          = local.prod_snaps_domain_name
  certificate_arn      = module.snaps_cert.acm_certificate_arn
  hosted_zone_id       = local.snaps_hosted_zone_id
  cloudfront_functions = local.cloudfront_functions
  tags                 = module.tags.common
}

module "s3_snaps_page_prod_new" {
  source = "../modules/aws-s3-website-no-r53"

  bucket_name          = local.prod_snaps_domain_name_new
  domain_name          = local.prod_snaps_domain_name_new
  certificate_arn      = local.snaps_cert_new
  cloudfront_functions = local.cloudfront_functions
  tags                 = module.tags.common
}
