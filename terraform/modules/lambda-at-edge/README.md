## Requirements

No requirements.

## Providers

| Name | Version |
|------|---------|
| <a name="provider_aws"></a> [aws](#provider\_aws) | n/a |

## Modules

| Name |
|------|
| [module.lambda](https://registry.terraform.io/modules/transcend-io/lambda-at-edge/aws/latest) | module |

## Resources

| Name | Type |
|------|------|
| [aws_s3_bucket.bucket](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/aws_s3_bucket) | resource |
| [aws_s3_bucket_acl.main](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/aws_s3_bucket_acl) | resource |
| [aws_s3_bucket_versioning.main_versioning](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/aws_s3_bucket_versioning) | resource |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="bucket_name"></a> [bucket\_name](#input\_bucket\_name) | Bucket name | `string` | n/a | yes |
| <a name="lambda_name"></a> [lambda\_name](#input\_lambda\_name) | Lambda name | `string` | n/a | yes |
| <a name="lambda_description"></a> [lambda\_description](#input\lambda\description) | Lambda description | `string` | n/a | yes |
| <a name="lambda_code_source_dir"></a> [lambda\_code\_source\_dir](#lambda\_code\_source\_dir) | Lambda code source dir | `string` | n/a | yes |
| <a name="input_tags"></a> [tags](#input\_tags) | Tags | `map(any)` | `{}` | no |

## Outputs

| Name | Description |
|------|-------------|
| <a name="function_arn"></a> [function\_arn](#function\_arn) | n/a |
