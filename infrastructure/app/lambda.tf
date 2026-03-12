# ── Post-confirmation Lambda (auto-assigns users to the member group) ──────────

# Data source lookup breaks the circular dependency between the Lambda
# (which needs the pool ID) and the User Pool (which needs the Lambda ARN).
data "aws_cognito_user_pools" "main" {
  name = "${var.project_name}-calendar-users"
}

data "archive_file" "post_confirmation" {
  type        = "zip"
  source_file = "${path.module}/../../app/lambda/post_confirmation.py"
  output_path = "${path.module}/../../app/lambda/post_confirmation.zip"
}

resource "aws_iam_role" "post_confirmation_role" {
  name = "${var.project_name}-post-confirmation-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_iam_role_policy_attachment" "post_confirmation_basic" {
  role       = aws_iam_role.post_confirmation_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "post_confirmation_cognito" {
  name = "${var.project_name}-post-confirmation-cognito"
  role = aws_iam_role.post_confirmation_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "cognito-idp:AdminAddUserToGroup"
      Resource = tolist(data.aws_cognito_user_pools.main.arns)[0]
    }]
  })
}

resource "aws_lambda_function" "post_confirmation" {
  filename         = data.archive_file.post_confirmation.output_path
  function_name    = "${var.project_name}-post-confirmation"
  role             = aws_iam_role.post_confirmation_role.arn
  handler          = "post_confirmation.handler"
  source_code_hash = data.archive_file.post_confirmation.output_base64sha256
  runtime          = "python3.11"
  timeout          = 10

  environment {
    variables = {
      USER_POOL_ID = tolist(data.aws_cognito_user_pools.main.ids)[0]
    }
  }

  tags = {
    Name        = "Post Confirmation"
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_lambda_permission" "cognito_post_confirmation" {
  statement_id  = "AllowCognitoInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.post_confirmation.function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = tolist(data.aws_cognito_user_pools.main.arns)[0]
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
  filename         = "${path.module}/../../app/lambda/calendar-api.zip"
  function_name    = "${var.project_name}-get-calendar-items"
  role             = aws_iam_role.calendar_lambda_role.arn
  handler          = "get_items.handler"
  source_code_hash = filebase64sha256("${path.module}/../../app/lambda/calendar-api.zip")
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
  filename         = "${path.module}/../../app/lambda/calendar-api.zip"
  function_name    = "${var.project_name}-create-calendar-item"
  role             = aws_iam_role.calendar_lambda_role.arn
  handler          = "create_item.handler"
  source_code_hash = filebase64sha256("${path.module}/../../app/lambda/calendar-api.zip")
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
  filename         = "${path.module}/../../app/lambda/calendar-api.zip"
  function_name    = "${var.project_name}-update-calendar-item"
  role             = aws_iam_role.calendar_lambda_role.arn
  handler          = "update_item.handler"
  source_code_hash = filebase64sha256("${path.module}/../../app/lambda/calendar-api.zip")
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
  filename         = "${path.module}/../../app/lambda/calendar-api.zip"
  function_name    = "${var.project_name}-delete-calendar-item"
  role             = aws_iam_role.calendar_lambda_role.arn
  handler          = "delete_item.handler"
  source_code_hash = filebase64sha256("${path.module}/../../app/lambda/calendar-api.zip")
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
