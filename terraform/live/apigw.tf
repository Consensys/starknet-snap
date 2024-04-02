module "voyager-gw-sepolia" {
  source = "../modules/aws-gw-voyager"

  uri  = "https://sepolia.voyager.online"
  name = "voyager-sepolia"
}

module "voyager-gw" {
  source = "../modules/aws-gw-voyager"

  uri  = "https://voyager.online"
  name = "voyager"
}
