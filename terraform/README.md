# Terraform

> Note (1): The steps will typically be run only **once** in local. Subsequent "live infrastructure" runs, will happen in gitlab pipelines
> Note (2): PGP ECC-Curve25519  is used to encrypt the user's access keys. Ask Consensys to access the Private/Public pair and import it with GPG
> Note (3): Run the live infrastructure from local first to be able to create (among other things) the kms keys

## Local Terraform lifecycle

### 1. Setup environment variables

* copy `env.sh.template` template file to `env.sh`
* update variable(s)
* run `source env.sh`

### 2. Terraform state initialization

```shell
# plan to see what is going to happen
make plan_state

# create resources in the cloud
make apply_state

# uploads init state into the terraform state bucket at init/terraform.tfstate
make upload_state

# use with caution
# downloads remote init state into init/terraform.tfstate
make download_state

# cleanup and delete all the resources created
make destroy_state
```

### 3. Terraform live infrastructure

```shell
# plan to see what is going to happen
make plan_live

# create resources in the cloud
make apply_live

# cleanup and delete all the resources created
make destroy_live
```

## CI / Pipeline Terraform lifecycle

### Environment variables

The Github terraform repository needs the following action secrets, gathered using `( cd terraform/init && terraform output ci_user_creds )`

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

## Terraform output

* Live infrastructure, such as s3 bucket urls or oidc role names, use `( cd terraform/live && terraform output )`
* Init terraform setup, such as the ci user aws credentials or the backend configuration information, use `( cd terraform/init && terraform output )`

## References

* [AWS Region Abreviations](https://docs.aws.amazon.com/AmazonS3/latest/userguide/aws-usage-report-understand.html)
