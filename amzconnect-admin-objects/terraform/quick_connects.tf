# Note: Quick Connects have a dependency upon needing a queue transfer flow which doesn't exist yet as contact flows 
# are the last pipeline to run so we need to create a simple one to deploy in advance.

locals {
  quick_connects = {
    phone_number = {
      quick_connect_config = {
        quick_connect_type = "PHONE_NUMBER"

        phone_config = {
          phone_number = "+18885551212"
        }
      }
    }
    sales = {
      quick_connect_config = {
        quick_connect_type = "QUEUE"

        queue_config = {
          contact_flow_id = try(module.amazon_connect.contact_flows["${var.capability_id}_QC_transferToQueue_AUTO"].contact_flow_id, null)
          queue_id        = try(module.amazon_connect.queues["Sales"].queue_id, null)
        }
      }
    }
    finance = {
      quick_connect_config = {
        quick_connect_type = "QUEUE"

        queue_config = {
          contact_flow_id = try(module.amazon_connect.contact_flows["${var.capability_id}_QC_transferToQueue_AUTO"].contact_flow_id, null)
          queue_id        = try(module.amazon_connect.queues["Finance"].queue_id, null)
        }
      }
    }
  }
}
