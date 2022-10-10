#############
## Backend
#############

terraform {
  backend "s3" {
    bucket         = "starknet-snap-tfstate-euc1"
    dynamodb_table = "starknet-snap-tfstate-euc1"
    region         = "eu-central-1"
    key            = "live/terraform.tfstate"
    encrypt        = true
  }
}


#############
## Setup provider
#############

provider "aws" {
  region  = var.region
  profile = var.aws_profile
}

provider "aws" {
  alias   = "use1"
  region  = "us-east-1"
  profile = var.aws_profile
}

#############
## Tags
#############

module "tags" {
  source      = "../modules/generic-tags"
  environment = var.env_type
  repository  = var.repository
  project     = var.project_name
  region      = var.region
}
