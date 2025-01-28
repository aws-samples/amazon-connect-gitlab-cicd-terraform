locals {
  rppath = "../../imports/resources/routing-profiles"
  rp     = fileset(local.rppath, "**")
  allrp  = { for rp in local.rp : trimsuffix(rp, ".json") => jsondecode(file("${local.rppath}/${rp}")) }


  # If routing profiles already exist (i.e. the development instance where the routing profiles were created)the below code can be uncommented and import the routing profiles, but 
  # must exist for the code to work. The data object will throw an error if the routing profiles do not exist.

  #   rp_names = [for k, v in local.allrp : v.Name]
  #   rp_imports = {
  #     for k, v in data.aws_connect_routing_profile.rp : k => "${nonsensitive(data.aws_ssm_parameter.amz-connect-instance-id.value)}:${v.routing_profile_id}"
  #   }
}
################################################################################
# Routing Profile Imports
################################################################################
## This code determines what quick connects are currently installed on the Amazon Connect instance

# data "aws_connect_routing_profile" "rp" {
#   for_each    = toset(local.rp_names)
#   instance_id = data.aws_ssm_parameter.amz-connect-instance-id.value
#   name        = each.value
# }

# output "rp_import_data" {
#   value = local.rp_imports
# }

# import {
#   for_each = local.rp_imports
#   to       = aws_connect_routing_profile.this[each.key]
#   id       = each.value
# }


################################################################################
# Routing  Profiles
################################################################################
resource "aws_connect_routing_profile" "this" {
  for_each = local.allrp

  # required
  default_outbound_queue_id = try(aws_connect_queue.this[each.value.OutboundQueue].queue_id, null)
  description               = each.value.Description
  instance_id               = local.instance_id

  dynamic "media_concurrencies" {
    for_each = each.value.Media

    content {
      channel     = media_concurrencies.value.Channel
      concurrency = media_concurrencies.value.Concurrency
    }
  }

  name = each.key

  # optional
  dynamic "queue_configs" {
    for_each = each.value.Queues

    content {
      channel  = queue_configs.value.Channel
      delay    = queue_configs.value.Delay
      priority = queue_configs.value.Priority
      queue_id = try(aws_connect_queue.this[queue_configs.value.QueueName].queue_id, data.aws_connect_queue.basicqueue.queue_id)
    }
  }

  #   # tags
  #   tags = merge(
  #     { Name = each.key },
  #     var.tags,
  #     var.routing_profile_tags,
  #     try(each.value.tags, {})
  #   )
  #
}

# output "routing_profiles" {
#   value = local.allrp
# }


