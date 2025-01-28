##
## This file is only used to import flows, if necessary, that were created via the 
## Provisioner lambda outside of terraform. It will be a no op (unused) during normal
## operations
##
##
locals {
  contact_flow_module_imports = {
    for k, v in data.aws_connect_contact_flow_module.modules : "${k}.json" => "${nonsensitive(data.aws_ssm_parameter.amz-connect-instance-id.value)}:${v.contact_flow_module_id}"
  }

  contact_flow_imports = {
    for k, v in data.aws_connect_contact_flow.contact_flows : "${k}.json" => "${nonsensitive(data.aws_ssm_parameter.amz-connect-instance-id.value)}:${v.contact_flow_id}"
  }
}

## This code determines what contact flows are currently installed on the Amazon Connect instance

data "aws_connect_contact_flow" "contact_flows" {
  for_each    = toset(local.contact_flow_names)
  instance_id = data.aws_ssm_parameter.amz-connect-instance-id.value
  name        = each.value
}



import {
  for_each = local.contact_flow_imports
  to       = aws_connect_contact_flow.contact_flows[each.key]
  id       = each.value
}


## This code determines what contact flow modules are currently installed on the Amazon Connect instance flows are currently installed on the Amazon Connect instance

data "aws_connect_contact_flow_module" "modules" {
  for_each    = toset(local.contact_flow_module_names)
  instance_id = data.aws_ssm_parameter.amz-connect-instance-id.value
  name        = each.value
}

import {
  for_each = local.contact_flow_module_imports
  to       = aws_connect_contact_flow_module.this[each.key]
  id       = each.value
}