
module "amazon_connect" {
  source = "git::https://github.com/aws-ia/terraform-aws-amazonconnect.git?ref=1c714db279cef6e9105a806927aa08dd0539a8e1"
  #   version = ">= 0.0.1"

  instance_id     = local.instance_id
  create_instance = false

  # Contact Flow for Queue Transfer
  contact_flows = local.contact_flows

  # Hours of Operations
  hours_of_operations = local.hours_of_operations

  # Queues
  queues = local.queues

  # Quick Connects
  quick_connects = local.quick_connects

  # Routing / Security Profiles
  routing_profiles  = local.routing_profiles
  security_profiles = local.security_profiles

  # Users / Hierarchy Group / Structure
  users = local.users

  # Vocabularies
  vocabularies = local.vocabularies

}
