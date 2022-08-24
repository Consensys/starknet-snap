output "terraform_backend_vars" {
  description = "Use following output to inject in backend configuration"

  value = <<-EOT
    bucket         = "${aws_s3_bucket.terraform_state.id}"
    dynamodb_table = "${aws_dynamodb_table.terraform_locks.name}"
    region         = "${var.state_region}"
    key            = "live/terraform.tfstate"   # <- change accordingly
    encrypt        = true
  EOT
}

output "terraform_state_bucket_name" {
  description = "Terraform state s3 bucket name"
  value       = aws_s3_bucket.terraform_state.id
}

output "ci_user_creds" {
  description = "CI user creds"
  value       = <<-EOT
    AWS_ACCESS_KEY_ID     = ${module.ci_user.iam_access_key_id}
    AWS_SECRET_ACCESS_KEY = `echo "${module.ci_user.iam_access_key_encrypted_secret}" | base64 -D | gpg --decrypt`
  EOT
}
