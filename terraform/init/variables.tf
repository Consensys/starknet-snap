variable "project_name" {
  type        = string
  description = "Project name becomes prefix for many resources and name of the resource group"
}

variable "repository" {
  description = "The project's repository"
}

variable "env_type" {
  description = "Free text, single word description of the environment type"
}

variable "state_region" {
  description = "Region where resources are deployed"
}

variable "aws_s3_bucket_name" {
  description = "AWS S3 bucket name for state file"
  type        = string
}

variable "aws_dynamodb_table_name" {
  description = "AWS Dynamo DB Table name for state file lock"
  type        = string
}

variable "aws_profile" {
  description = "AWS Profile"
  default     = ""
}

variable "pgp_key" {
  description = "PGP key used to (de/en)crypt the ci user secret key. For further information visit https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/iam_access_key#pgp_key"
}
