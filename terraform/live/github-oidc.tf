#############
## GitHub Actions OIDC
#############

locals {
  github_repository = "Consensys/starknet-snap"

  deploy_targets = {
    dev = {
      bucket_arn = module.s3_snaps_page_dev_new.bucket_arn
      cf_arn     = module.s3_snaps_page_dev_new.cf_arn
    }
    staging = {
      bucket_arn = module.s3_snaps_page_staging_new.bucket_arn
      cf_arn     = module.s3_snaps_page_staging_new.cf_arn
    }
    production = {
      bucket_arn = module.s3_snaps_page_prod_new.bucket_arn
      cf_arn     = module.s3_snaps_page_prod_new.cf_arn
    }
  }
}

resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1", "1c58a3a8518e8759bf075b76b750d4f2df264fcd"]
  tags            = module.tags.common
}

data "aws_iam_policy_document" "deploy_trust" {
  for_each = local.deploy_targets

  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${local.github_repository}:environment:${each.key}"]
    }
  }
}

data "aws_iam_policy_document" "deploy" {
  for_each = local.deploy_targets

  statement {
    actions   = ["s3:ListBucket"]
    resources = [each.value.bucket_arn]
  }

  statement {
    actions   = ["s3:GetObject", "s3:PutObject"]
    resources = ["${each.value.bucket_arn}/*"]
  }

  statement {
    actions   = ["cloudfront:CreateInvalidation", "cloudfront:GetInvalidation"]
    resources = [each.value.cf_arn]
  }
}

resource "aws_iam_role" "deploy" {
  for_each = local.deploy_targets

  name                 = "${var.project_name}-gha-deploy-${each.key}"
  assume_role_policy   = data.aws_iam_policy_document.deploy_trust[each.key].json
  max_session_duration = 3600
  tags                 = module.tags.common
}

resource "aws_iam_role_policy" "deploy" {
  for_each = local.deploy_targets

  name   = "deploy"
  role   = aws_iam_role.deploy[each.key].id
  policy = data.aws_iam_policy_document.deploy[each.key].json
}

data "aws_iam_policy_document" "terraform_plan_trust" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${local.github_repository}:pull_request"]
    }
  }
}

data "aws_iam_policy_document" "terraform_plan_state" {
  statement {
    actions   = ["s3:ListBucket"]
    resources = ["arn:aws:s3:::starknet-snap-tfstate-euc1"]
  }

  statement {
    actions   = ["s3:GetObject"]
    resources = ["arn:aws:s3:::starknet-snap-tfstate-euc1/live/*"]
  }

  statement {
    actions   = ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:DeleteItem"]
    resources = ["arn:aws:dynamodb:eu-central-1:905502874957:table/starknet-snap-tfstate-euc1"]
  }

  statement {
    actions   = ["kms:Decrypt"]
    resources = ["arn:aws:kms:eu-central-1:905502874957:key/ecc149fe-381f-46ca-bf8f-456c474f992d"]
  }
}

resource "aws_iam_role" "terraform_plan" {
  name                 = "${var.project_name}-gha-terraform-plan"
  assume_role_policy   = data.aws_iam_policy_document.terraform_plan_trust.json
  max_session_duration = 3600
  tags                 = module.tags.common
}

resource "aws_iam_role_policy_attachment" "terraform_plan_readonly" {
  role       = aws_iam_role.terraform_plan.name
  policy_arn = "arn:aws:iam::aws:policy/ReadOnlyAccess"
}

resource "aws_iam_role_policy" "terraform_plan_state" {
  name   = "terraform-state"
  role   = aws_iam_role.terraform_plan.id
  policy = data.aws_iam_policy_document.terraform_plan_state.json
}
