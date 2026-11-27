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

variable "domain_name" {
  description = "Domain name."
  type        = string
}

variable "certificate_arn" {
  description = "Certificate ARN."
  type        = string
  default     = ""
}

variable "cloudfront_functions" {
  description = "Function arn"
  type        = any #map(map(string))
  default     = {}
}

variable "lambda_function_arn" {
  description = "Lambda function arn"
  type        = list(string)
  default     = []
}
variable "cache_policy_id" {
  description = "CloudFront cache policy ID for the default behavior. When null, legacy forwarded_values with TTL 0 are used."
  type        = string
  default     = null
}

variable "origin_request_policy_id" {
  description = "CloudFront origin request policy ID for the default behavior."
  type        = string
  default     = null
}

variable "response_headers_policy_id" {
  description = "CloudFront response headers policy ID for the default behavior."
  type        = string
  default     = null
}
