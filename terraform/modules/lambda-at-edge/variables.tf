variable "bucket_name" {
  description = "Bucket name"
  type        = string
}

variable "tags" {
  description = "Tags."
  type        = map(any)
  default     = {}
}

variable "lambda_name" {
  description = "Lambda name"
  type        = string
}

variable "lambda_description" {
  description = "Lambda name"
  type        = string
}

variable "lambda_code_source_dir" {
  description = "Lambda location folder path"
  type        = string
}