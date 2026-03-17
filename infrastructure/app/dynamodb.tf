# DynamoDB table for calendar items
resource "aws_dynamodb_table" "calendar_items" {
  name         = "${var.project_name}-calendar-items"
  billing_mode = "PAY_PER_REQUEST" # On-demand pricing - most cost-effective for low traffic
  hash_key     = "id"
  range_key    = "timestamp"

  attribute {
    name = "id"
    type = "S" # String
  }

  attribute {
    name = "timestamp"
    type = "N" # Number (Unix timestamp)
  }

  attribute {
    name = "date"
    type = "S" # String (ISO date format YYYY-MM-DD)
  }

  attribute {
    name = "gsipk"
    type = "S" # Static partition key for GSIs (e.g. "EVENT")
  }

  # Global Secondary Index for querying all items by date range
  global_secondary_index {
    name            = "ItemsByDate"
    hash_key        = "gsipk"
    range_key       = "date"
    projection_type = "ALL"
  }

  # Enable point-in-time recovery for data protection
  point_in_time_recovery {
    enabled = true
  }

  # Enable encryption at rest
  server_side_encryption {
    enabled = true
  }

  tags = {
    Name        = "Lantern Lounge Calendar Items"
    Environment = var.environment
    Project     = var.project_name
  }
}
