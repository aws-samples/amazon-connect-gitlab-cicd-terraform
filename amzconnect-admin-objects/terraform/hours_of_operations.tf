locals {
  #   time_zone        = "US/Eastern"
  #   weekdays         = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"]
  #   support_weekends = ["SUNDAY", "SATURDAY"]

  hooppath = "../../imports/resources/hoop"
  hoops    = fileset(local.hooppath, "**")
  allhoops = { for hoop in local.hoops : trimsuffix(hoop, ".json") => jsondecode(file("${local.hooppath}/${hoop}")) }

  # If hoops already exist (i.e. the development instance where the hoops were created) the below code can be uncommented and import the hoops, but 
  # must exist for the code to work. The data object will throw an error if the hoops do not exist.

  #   hoop_names = [for k, v in local.allhoops : v.Name]
  #   hoop_imports = {
  #     for k, v in data.aws_connect_hours_of_operation.hoops : k => "${nonsensitive(data.aws_ssm_parameter.amz-connect-instance-id.value)}:${v.hours_of_operation_id}"
  #   }
}
################################################################################
# Hours of Operation Imports
################################################################################
## This code determines what hoops are currently installed on the Amazon Connect instance

# data "aws_connect_hours_of_operation" "hoops" {
#   for_each    = toset(local.hoop_names)
#   instance_id = data.aws_ssm_parameter.amz-connect-instance-id.value
#   name        = each.value
# }

# output "contact_hoops_import_data" {
#   value = local.hoop_imports
# }

# import {
#   for_each = local.hoop_imports
#   to       = aws_connect_hours_of_operation.this[each.key]
#   id       = each.value
# }

################################################################################
# Hours of Operation
################################################################################
resource "aws_connect_hours_of_operation" "this" {
  for_each = local.allhoops

  # required
  dynamic "config" {
    for_each = each.value.Config

    content {
      day = config.value.Day

      end_time {
        hours   = config.value.EndTime.Hours
        minutes = config.value.EndTime.Minutes
      }

      start_time {
        hours   = config.value.StartTime.Hours
        minutes = config.value.StartTime.Minutes
      }
    }
  }

  instance_id = local.instance_id
  name        = each.key
  time_zone   = each.value.TimeZone

  # optional
  description = try(each.value.description, null)

}




