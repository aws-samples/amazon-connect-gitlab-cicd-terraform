locals {
  contact_flows = {
    "${var.capability_id}_QC_transferToQueue_AUTO" = {
      type     = "QUEUE_TRANSFER"
      filename = "${path.module}/../contact_flows/ACME_QC_transferToQueue_AUTO.json"
    }
  }
}
