## Required environment variables
# check file `env.sh.template`

export STATE_DIR = init
export STATE_TFVARS = terraform.tfvars
export LIVE_DIR = live

#########
## State
#########

.PHONY: init_state
init_state:
	cd ${STATE_DIR} && terraform init --reconfigure

.PHONY: apply_state
apply_state: init_state
	cd ${STATE_DIR} && terraform apply -auto-approve -var-file=${STATE_TFVARS}

.PHONY: plan_state
plan_state: init_state
	cd ${STATE_DIR} && terraform plan -var-file=${STATE_TFVARS}

.PHONY: output_state
output_state: init_state
	cd ${STATE_DIR} && terraform output

.PHONY: destroy_state
destroy_state: init_state
	cd ${STATE_DIR} && terraform destroy -auto-approve -var-file=${STATE_TFVARS}

# AWS specific
.PHONY: upload_state
upload_state: init_state
	cd ${STATE_DIR} && \
	aws s3 cp terraform.tfstate s3://$$(terraform output --raw terraform_state_bucket_name)/init/terraform.tfstate

# AWS specific
.PHONY: download_state
download_state: init_state
	cd ${STATE_DIR} && \
	aws s3 cp s3://$$(terraform output --raw terraform_state_bucket_name)/init/terraform.tfstate terraform.tfstate

#########
## Live
#########

.PHONY: init_live
init_live:
	cd ${LIVE_DIR} && terraform init --reconfigure

.PHONY: plan_live
plan_live: init_live
	cd ${LIVE_DIR} && terraform plan

.PHONY: apply_live
apply_live: init_live
	cd ${LIVE_DIR} && terraform apply -auto-approve

.PHONY: output_live
output_live: init_live
	cd ${LIVE_DIR} && terraform output

.PHONY: destroy_live
destroy_live: init_live
	cd ${LIVE_DIR} && terraform destroy -auto-approve
