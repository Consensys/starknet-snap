#############
## DNS
#############

locals {
  hosted_zone_name    = "starknet-snap.consensys-solutions.net"
  hosted_zone_id      = aws_route53_zone.main.zone_id
  dev_domain_name     = "app-dev.${local.hosted_zone_name}"
  staging_domain_name = "app-staging.${local.hosted_zone_name}"
  prod_domain_name    = "app.${local.hosted_zone_name}"
}

resource "aws_route53_zone" "main" {
  name = local.hosted_zone_name
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

#############
## Dev
#############

module "s3_dev" {
  source = "../modules/aws-s3-website"

  bucket_name     = local.dev_domain_name
  domain_name     = local.dev_domain_name
  certificate_arn = module.cert.acm_certificate_arn
  hosted_zone_id  = local.hosted_zone_id
  tags            = module.tags.common
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
  tags            = module.tags.common
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
  tags            = module.tags.common
}
