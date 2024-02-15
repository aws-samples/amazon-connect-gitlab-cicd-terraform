locals {
  routing_profiles = {
    Sales = {
      description               = "Routing profile for Sales"
      default_outbound_queue_id = try(module.amazon_connect.queues["Sales"].queue_id, null)

      media_concurrencies = [
        {
          channel     = "VOICE"
          concurrency = 1 // Always 1 for Voice
        },
        {
          channel     = "CHAT"
          concurrency = 2 // between 1 and 5
        }
      ]

      queue_configs = [
        {
          channel  = "VOICE"
          delay    = 0
          priority = 1
          queue_id = try(module.amazon_connect.queues["Sales"].queue_id, null)
        },
        {
          channel  = "CHAT"
          delay    = 0
          priority = 1
          queue_id = try(module.amazon_connect.queues["Sales"].queue_id, null)
        }
      ]
    }
    Finance = {
      description               = "Routing profile for Finance"
      default_outbound_queue_id = try(module.amazon_connect.queues["Finance"].queue_id, null)

      media_concurrencies = [
        {
          channel     = "VOICE"
          concurrency = 1 // Always 1 for Voice
        },
        {
          channel     = "CHAT"
          concurrency = 2 // between 1 and 5
        }
      ]

      queue_configs = [
        {
          channel  = "VOICE"
          delay    = 0
          priority = 1
          queue_id = try(module.amazon_connect.queues["Finance"].queue_id, null)
        },
        {
          channel  = "CHAT"
          delay    = 0
          priority = 1
          queue_id = try(module.amazon_connect.queues["Finance"].queue_id, null)
        }
      ]
    }
  }
  security_profiles = {
    example = {
      description = "Example security profile"

      permissions = [
        "AccessMetrics.Dashboards.Access",
        "AccessMetrics.HistoricalMetrics.Access",
        "AccessMetrics.RealTimeMetrics.Access",
        "BasicAgentAccess",
        "ContentManagement.View",
        "CustomViews.Access",
        "CustomerProfiles.Create",
        "CustomerProfiles.Edit",
        "CustomerProfiles.View",
        "OutboundCallAccess",
        "Views.View"
      ]
    }
  }
}
