locals {
  queues = {
    Sales = {
      hours_of_operation_id = try(module.amazon_connect.hours_of_operations["Sales"].hours_of_operation_id, null)
      max_contacts          = 5
    }
    Finance = {
      hours_of_operation_id = try(module.amazon_connect.hours_of_operations["Finance"].hours_of_operation_id, null)
      max_contacts          = 9
    }
  }
}
