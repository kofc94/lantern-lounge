# ── Lambda Code Packaging ─────────────────────────────────────────────────────

data "archive_file" "calendar_api" {
  type        = "zip"
  source_dir  = "${path.module}/api"
  output_path = "${path.module}/calendar-api.zip"
}

# ── IAM role for calendar Lambda functions ─────────────────────────────────────

resource "aws_iam_role" "calendar_lambda_role" {
  name = "${var.project_name}-calendar-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "Lantern Lounge Calendar Lambda Role"
    Environment = var.environment
    Project     = var.project_name
  }
}

# IAM policy for DynamoDB access
resource "aws_iam_role_policy" "calendar_lambda_dynamodb" {
  name = "${var.project_name}-calendar-lambda-dynamodb"
  role = aws_iam_role.calendar_lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          aws_dynamodb_table.calendar_items.arn,
          "${aws_dynamodb_table.calendar_items.arn}/index/*"
        ]
      }
    ]
  })
}

# Attach AWS managed policy for basic Lambda execution
resource "aws_iam_role_policy_attachment" "calendar_lambda_basic" {
  role       = aws_iam_role.calendar_lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Lambda function: Get Calendar Items
resource "aws_lambda_function" "get_calendar_items" {
  filename         = data.archive_file.calendar_api.output_path
  function_name    = "${var.project_name}-get-calendar-items"
  role             = aws_iam_role.calendar_lambda_role.arn
  handler          = "get_items.handler"
  source_code_hash = data.archive_file.calendar_api.output_base64sha256
  runtime          = "python3.11"
  timeout          = 30

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.calendar_items.name
    }
  }

  tags = {
    Name        = "Get Calendar Items"
    Environment = var.environment
    Project     = var.project_name
  }
}

# Lambda function: Create Calendar Item
resource "aws_lambda_function" "create_calendar_item" {
  filename         = data.archive_file.calendar_api.output_path
  function_name    = "${var.project_name}-create-calendar-item"
  role             = aws_iam_role.calendar_lambda_role.arn
  handler          = "create_item.handler"
  source_code_hash = data.archive_file.calendar_api.output_base64sha256
  runtime          = "python3.11"
  timeout          = 30

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.calendar_items.name
    }
  }

  tags = {
    Name        = "Create Calendar Item"
    Environment = var.environment
    Project     = var.project_name
  }
}

# Lambda function: Update Calendar Item
resource "aws_lambda_function" "update_calendar_item" {
  filename         = data.archive_file.calendar_api.output_path
  function_name    = "${var.project_name}-update-calendar-item"
  role             = aws_iam_role.calendar_lambda_role.arn
  handler          = "update_item.handler"
  source_code_hash = data.archive_file.calendar_api.output_base64sha256
  runtime          = "python3.11"
  timeout          = 30

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.calendar_items.name
    }
  }

  tags = {
    Name        = "Update Calendar Item"
    Environment = var.environment
    Project     = var.project_name
  }
}

# Lambda function: Delete Calendar Item
resource "aws_lambda_function" "delete_calendar_item" {
  filename         = data.archive_file.calendar_api.output_path
  function_name    = "${var.project_name}-delete-calendar-item"
  role             = aws_iam_role.calendar_lambda_role.arn
  handler          = "delete_item.handler"
  source_code_hash = data.archive_file.calendar_api.output_base64sha256
  runtime          = "python3.11"
  timeout          = 30

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.calendar_items.name
    }
  }

  tags = {
    Name        = "Delete Calendar Item"
    Environment = var.environment
    Project     = var.project_name
  }
}

# Lambda permissions for API Gateway to invoke functions
resource "aws_lambda_permission" "api_gateway_get" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_calendar_items.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.calendar_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "api_gateway_create" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.create_calendar_item.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.calendar_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "api_gateway_update" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.update_calendar_item.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.calendar_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "api_gateway_delete" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.delete_calendar_item.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.calendar_api.execution_arn}/*/*"
}
