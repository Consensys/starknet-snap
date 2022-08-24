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

variable "region" {
  description = "Region where resources are deployed"
}

variable "aws_profile" {
  description = "AWS Profile"
  default     = ""
}
