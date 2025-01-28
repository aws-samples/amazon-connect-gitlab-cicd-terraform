## Users would typically not be created via this CI/CD pipeline, however we are doing so to enable calling into the workshop.

resource "aws_connect_user" "finance_agent" {
  instance_id        = local.instance_id
  name               = "finance_agent"
  password           = "SomeSecurePassword!1234" # Recommended to be passed in through variables if used
  routing_profile_id = try(aws_connect_routing_profile.this["finance"].routing_profile_id, null)

  security_profile_ids = try([aws_connect_security_profile.this["example"].security_profile_id], [])


  identity_info {
    first_name = "Finance"
    last_name  = "Agent"
    email      = "finance@example.com"
  }

  phone_config {
    after_contact_work_time_limit = 0
    phone_type                    = "SOFT_PHONE"
    auto_accept                   = false
  }
}

resource "aws_connect_user" "sales_agent" {
  instance_id        = local.instance_id
  name               = "sales_agent"
  password           = "SomeSecurePassword!1234" # Recommended to be passed in through variables if used
  routing_profile_id = try(aws_connect_routing_profile.this["sales"].routing_profile_id, null)

  security_profile_ids = try([aws_connect_security_profile.this["example"].security_profile_id], [])


  identity_info {
    first_name = "Sales"
    last_name  = "Agent"
    email      = "sales@example.com"
  }

  phone_config {
    after_contact_work_time_limit = 0
    phone_type                    = "SOFT_PHONE"
    auto_accept                   = false
  }
}

