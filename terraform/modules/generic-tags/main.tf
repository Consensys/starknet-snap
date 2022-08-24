locals {
  common = {
    environment = var.environment
    project     = var.project
    region      = var.region
    repository  = var.repository
    Terraform   = "TRUE"
  }
}
