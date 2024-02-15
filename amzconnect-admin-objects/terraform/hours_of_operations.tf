locals {
  time_zone        = "US/Eastern"
  weekdays         = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"]
  support_weekends = ["SUNDAY", "SATURDAY"]

  hours_of_operations = {
    Sales = {
      description = "HOOP for Sales"
      time_zone   = local.time_zone
      config = [
        for w in local.weekdays : {
          day = w
          start_time = {
            hours   = 8 # 8 AM
            minutes = 0
          }
          end_time = {
            hours   = 18 # 6 PM
            minutes = 0
          }
        }
      ]
    }
    Finance = {
      description = "HOOP for Finance"
      time_zone   = local.time_zone
      config = [
        for w in local.weekdays : {
          day = w
          start_time = {
            hours   = 8 # 8AM
            minutes = 0
          }
          end_time = {
            hours   = 18 # 6 PM
            minutes = 0
          }
        }
      ]
    }
    Support = {
      description = "HOOP for Support"
      time_zone   = local.time_zone
      config = flatten([
        [
          for w in local.weekdays : {
            day = w
            start_time = {
              hours   = 8 # 8 AM
              minutes = 0
            }
            end_time = {
              hours   = 18 # 6 PM
              minutes = 0
            }
          }
        ],
        flatten([
          for w in local.support_weekends : [
            # Second loop, need two start/end times per day, with break in between
            # 9 AM - 12PM, 1 PM - 5 PM
            for t in [{ start = 9, end = 12 }, { start = 13, end = 17 }] : {
              day = w
              start_time = {
                hours   = t.start
                minutes = 0
              }
              end_time = {
                hours   = t.end
                minutes = 0
              }
            }
          ]
        ])
      ])
    }
  }
}
