provider "aws" {
  region = var.state_region
}

module "tags" {
  source      = "../modules/generic-tags"
  environment = var.env_type
  repository  = var.repository
  project     = var.project_name
  region      = var.state_region
}

resource "aws_s3_bucket" "terraform_state" {
  bucket        = var.aws_s3_bucket_name
  tags          = module.tags.common
  force_destroy = true
}

resource "aws_s3_bucket_acl" "aws_s3_bucket_name" {
  bucket = aws_s3_bucket.terraform_state.id
  acl    = "private"
}

resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  rule {
    bucket_key_enabled = true
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.terraform_state.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  block_public_acls       = true
  block_public_policy     = true
  restrict_public_buckets = true
  ignore_public_acls      = true
}


resource "aws_dynamodb_table" "terraform_locks" {
  name         = var.aws_dynamodb_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"
  tags         = module.tags.common

  attribute {
    name = "LockID"
    type = "S"
  }
}

resource "aws_kms_key" "terraform_state" {
  description             = "KMS Key for terraform state s3 encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true
  tags                    = module.tags.common
}

resource "aws_kms_alias" "terraform_state" {
  name          = "alias/${var.aws_s3_bucket_name}-s3-kms"
  target_key_id = aws_kms_key.terraform_state.key_id
}

#############
## Administrators Group
#############

data "aws_iam_policy" "aws_managed_administrator_access_policy" {
  arn = "arn:aws:iam::aws:policy/AdministratorAccess"
}

resource "aws_iam_group" "administrators" {
  name = "administrators"
  path = "/groups/"
}

resource "aws_iam_group_policy_attachment" "administrators_policy_attachment" {
  group      = aws_iam_group.administrators.name
  policy_arn = data.aws_iam_policy.aws_managed_administrator_access_policy.arn
}

#############
## CI User
#############

module "ci_user" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-user"
  version = "5.1.0"

  name                          = "ci-user"
  path                          = "/robot/"
  create_iam_user_login_profile = false
  force_destroy                 = true
  pgp_key                       = var.pgp_key
  tags                          = module.tags.common
}

resource "aws_iam_user_group_membership" "ci_user_administrators_membership" {
  user = module.ci_user.iam_user_name

  groups = [
    aws_iam_group.administrators.name,
  ]
}
