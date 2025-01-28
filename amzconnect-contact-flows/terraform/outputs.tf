output "contact_flows_import_data" {
  description = "The name of all contact flows to be imported into terraform state"
  value       = local.contact_flow_imports
}

output "contact_flow_module_import_data" {
  description = "The name of all contact flow modules to be imported into terraform state"
  value       = local.contact_flow_module_imports
}

output "contact_flows" {
  description = "The name of all contact flows in local directory"
  value       = [for k, v in local.contact_flows : k]
}

output "contact_flow_modules" {
  description = "The name of all contact flow modules in local directory"
  value       = [for k, v in local.contact_flow_modules : k]
}