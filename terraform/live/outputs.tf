# Add NS records for the subdomain to the zone file for the parent domain
output "subdomain_name_servers" {
  description = "AWS R53 Subdomain name servers"
  value       = aws_route53_zone.main.name_servers
}

output "dev_domain_name" {
  description = "Environment domain name"
  value       = local.dev_domain_name
}
