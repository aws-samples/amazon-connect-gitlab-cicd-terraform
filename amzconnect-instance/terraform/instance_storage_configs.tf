locals {
  instance_storage_configs = {
    # S3
    CALL_RECORDINGS = {
      storage_type = "S3"

      s3_config = {
        bucket_name   = aws_s3_bucket.this.id
        bucket_prefix = "CALL_RECORDINGS"

        encryption_config = {
          encryption_type = "KMS"
          key_id          = aws_kms_key.this.arn
        }
      }
    }
    CHAT_TRANSCRIPTS = {
      storage_type = "S3"

      s3_config = {
        bucket_name   = aws_s3_bucket.this.id
        bucket_prefix = "CHAT_TRANSCRIPTS"

        encryption_config = {
          encryption_type = "KMS"
          key_id          = aws_kms_key.this.arn
        }
      }
    }
    SCHEDULED_REPORTS = {
      storage_type = "S3"

      s3_config = {
        bucket_name   = aws_s3_bucket.this.id
        bucket_prefix = "SCHEDULED_REPORTS"

        encryption_config = {
          encryption_type = "KMS"
          key_id          = aws_kms_key.this.arn
        }
      }
    }

    # Kinesis
    AGENT_EVENTS = {
      storage_type = "KINESIS_STREAM"

      kinesis_stream_config = {
        stream_arn = aws_kinesis_stream.this.arn
      }
    }
    CONTACT_TRACE_RECORDS = {
      storage_type = "KINESIS_FIREHOSE"

      kinesis_firehose_config = {
        firehose_arn = aws_kinesis_firehose_delivery_stream.this.arn
      }
    }
    MEDIA_STREAMS = {
      storage_type = "KINESIS_VIDEO_STREAM"

      kinesis_video_stream_config = {
        prefix                 = "MEDIA_STREAMS"
        retention_period_hours = 24

        encryption_config = {
          encryption_type = "KMS"
          key_id          = aws_kms_key.this.arn
        }
      }
    }
  }
}

# S3
resource "aws_s3_bucket" "this" {
  # These controls aren't deemed necessary for this demo.
  # checkov:skip=CKV2_AWS_62 Ensure S3 buckets should have event notifications enabled
  # checkov:skip=CKV_AWS_18 Ensure the S3 bucket has access logging enabled
  # checkov:skip=CKV_AWS_144 Ensure that S3 bucket has cross-region replication enabled
  # checkov:skip=CKV2_AWS_61 Ensure that an S3 bucket has a lifecycle configuration
  force_destroy = true
  bucket        = join("-", [var.ivr_id, var.env, local.region_shortnames[var.region], var.instance_alias, data.aws_caller_identity.current.account_id])
}


resource "aws_s3_bucket_public_access_block" "this" {
  bucket                  = aws_s3_bucket.this.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "this" {
  bucket = aws_s3_bucket.this.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.this.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_versioning" "this" {
  bucket = aws_s3_bucket.this.id

  versioning_configuration {
    status = "Enabled"
  }
}

#S3 Logging
resource "aws_s3_bucket" "logging" {
  # This bucket is used for logging
  # checkov:skip=CKV2_AWS_62 Ensure S3 buckets should have event notifications enabled
  # checkov:skip=CKV_AWS_18 Ensure the S3 bucket has access logging enabled
  # checkov:skip=CKV_AWS_144 Ensure that S3 bucket has cross-region replication enabled
  # checkov:skip=CKV_AWS_145 Ensure that S3 buckets are encrypted with KMS by default
  # checkov:skip=CKV2_AWS_61 Ensure that an S3 bucket has a lifecycle configuration
  force_destroy = true
}

# resource "aws_s3_bucket_acl" "logging" {
#   bucket = aws_s3_bucket.logging.id
#   acl    = "log-delivery-write"
# }

resource "aws_s3_bucket_public_access_block" "logging" {
  bucket                  = aws_s3_bucket.logging.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logging" {
  bucket = aws_s3_bucket.logging.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_versioning" "logging" {
  bucket = aws_s3_bucket.logging.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Kinesis
resource "aws_kinesis_stream" "this" {
  name            = module.amazon_connect.instance.id
  encryption_type = "KMS"
  kms_key_id      = aws_kms_key.this.id

  stream_mode_details {
    stream_mode = "ON_DEMAND"
  }
}

resource "aws_kinesis_firehose_delivery_stream" "this" {
  name        = module.amazon_connect.instance.id
  destination = "extended_s3"

  server_side_encryption {
    enabled  = true
    key_type = "CUSTOMER_MANAGED_CMK"
    key_arn  = aws_kms_key.this.arn
  }

  extended_s3_configuration {
    bucket_arn = aws_s3_bucket.this.arn
    prefix     = "CONTACT_TRACE_RECORDS/"
    role_arn   = aws_iam_role.firehose.arn
  }
}

# IAM
resource "aws_iam_role" "firehose" {
  assume_role_policy = data.aws_iam_policy_document.firehose_assume_role_policy.json
}

data "aws_iam_policy_document" "firehose_assume_role_policy" {
  statement {
    principals {
      type        = "Service"
      identifiers = ["firehose.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role_policy" "firehose" {
  role   = aws_iam_role.firehose.id
  policy = data.aws_iam_policy_document.firehose_role_policy.json
}

data "aws_iam_policy_document" "firehose_role_policy" {
  statement {
    actions = [
      "s3:GetBucket",
      "s3:GetBucketAcl",
      "s3:ListBucket",
      "s3:ListBucketAcl"
    ]
    resources = [aws_s3_bucket.this.arn]
  }

  statement {
    actions = [
      "s3:AbortMultipartUpload",
      "s3:GetObject",
      "s3:GetObjectAcl",
      "s3:GetObjectVersion",
      "s3:GetObjectVersionAcl",
      "s3:ListMultipartUploadParts",
      "s3:PutObject",
      "s3:PutObjectAcl",
      "s3:PutObjectVersionAcl"
    ]
    resources = ["${aws_s3_bucket.this.arn}/CONTACT_TRACE_RECORDS/*"]
  }
}


# KMS Key
resource "aws_kms_key" "this" {
  policy              = data.aws_iam_policy_document.this_key_policy.json
  enable_key_rotation = true
}

data "aws_iam_policy_document" "this_key_policy" {
  # These controls aren't deemed necessary for this demo.
  # checkov:skip=CKV_AWS_109 Ensure IAM policies does not allow permissions management / resource exposure without constraints
  # checkov:skip=CKV_AWS_111 Ensure IAM policies does not allow write access without constraints
  # checkov:skip=CKV_AWS_356 Ensure no IAM policies documents allow "*" as a statement's resource for restrictable actions
  # Key Administrators
  statement {
    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]
    }

    actions   = ["kms:*"]
    resources = ["*"]
  }

  # Key Users
  statement {
    principals {
      type = "AWS"

      identifiers = [
        module.amazon_connect.instance.service_role,
        aws_iam_role.firehose.arn
      ]
    }

    actions = [
      "kms:Decrypt",
      "kms:DescribeKey",
      "kms:Encrypt",
      "kms:GenerateDataKey*",
      "kms:ReEncrypt*"
    ]
    resources = ["*"]
  }
}
