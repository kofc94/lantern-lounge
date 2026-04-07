# DynamoDB table for guest check-ins
resource "aws_dynamodb_table" "check_ins" {
  name         = "${var.project_name}-check-ins"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"
  range_key    = "timestamp"

  attribute {
    name = "id"
    type = "S" # UUID
  }

  attribute {
    name = "timestamp"
    type = "S" # ISO-8601
  }

  attribute {
    name = "user_id"
    type = "S" # Cognito sub
  }

  # Index to find all check-ins for a specific user
  global_secondary_index {
    name            = "UserCheckIns"
    hash_key        = "user_id"
    range_key       = "timestamp"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  tags = {
    Name        = "Lantern Lounge Check-ins"
    Environment = var.environment
    Project     = var.project_name
  }
}
