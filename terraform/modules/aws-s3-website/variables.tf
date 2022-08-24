variable "bucket_name" {
  description = "Bucket name"
  type        = string
}

variable "tags" {
  description = "Tags."
  type        = map(any)
  default     = {}
}

variable "enable_versioning" {
  description = "Enable versioning"
  type        = bool
  default     = false
}

variable "acl" {
  description = "Bucket ACL"
  type        = string
  default     = "private"
}

variable "hosted_zone_id" {
  description = "Route 53 hosted zone id"
  type        = string
}

variable "domain_name" {
  description = "Domain name."
  type        = string
}

variable "certificate_arn" {
  description = "Certificate ARN."
  type        = string
  default     = ""
}
