terraform {

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 4.18.0"
    }
  }

  required_version = "~> 1.2.2"
}
