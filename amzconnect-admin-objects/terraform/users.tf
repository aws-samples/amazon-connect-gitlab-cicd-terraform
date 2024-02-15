locals {
  users = {
    sales_agent = {
      password             = "SomeSecurePassword!1234" # Recommended to be passed in through variables if used
      routing_profile_id   = try(module.amazon_connect.routing_profiles["Sales"].routing_profile_id, null)
      security_profile_ids = try([module.amazon_connect.security_profiles["example"].security_profile_id], [])

      identity_info = {
        email      = "sales@example.com"
        first_name = "Sales"
        last_name  = "Agent"
      }

      phone_config = {
        phone_type                    = "SOFT_PHONE"
        after_contact_work_time_limit = 5
        auto_accept                   = false
      }
    },
    finance_agent = {
      password             = "SomeSecurePassword!1234" # Recommended to be passed in through variables if used
      routing_profile_id   = try(module.amazon_connect.routing_profiles["Finance"].routing_profile_id, null)
      security_profile_ids = try([module.amazon_connect.security_profiles["example"].security_profile_id], [])

      identity_info = {
        email      = "finance@example.com"
        first_name = "Finance"
        last_name  = "Agent"
      }

      phone_config = {
        phone_type                    = "SOFT_PHONE"
        after_contact_work_time_limit = 5
        auto_accept                   = false
      }
    }
  }
}