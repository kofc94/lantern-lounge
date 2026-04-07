# ── Lambda Code Packaging ─────────────────────────────────────────────────────

data "archive_file" "checkins_api" {
  type        = "zip"
  source_dir  = "${path.module}/api"
  output_path = "${path.module}/checkins-api.zip"
}

# ── IAM role for check-ins Lambda functions ──────────────────────────────────

resource "aws_iam_role" "checkins_lambda_role" {
  name = "${var.project_name}-checkins-lambda-role"

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
}

# IAM policy for DynamoDB access
resource "aws_iam_role_policy" "checkins_lambda_permissions" {
  name = "${var.project_name}-checkins-lambda-permissions"
  role = aws_iam_role.checkins_lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query"
        ]
        Resource = [
          aws_dynamodb_table.check_ins.arn,
          "${aws_dynamodb_table.check_ins.arn}/index/*"
        ]
      }
    ]
  })
}

# Attach AWS managed policy for basic Lambda execution
resource "aws_iam_role_policy_attachment" "checkins_lambda_basic" {
  role       = aws_iam_role.checkins_lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Lambda function: Get Wallet Pass
resource "aws_lambda_function" "get_wallet_pass" {
  filename         = data.archive_file.checkins_api.output_path
  function_name    = "${var.project_name}-get-wallet-pass"
  role             = aws_iam_role.checkins_lambda_role.arn
  handler          = "get_wallet_pass.handler"
  source_code_hash = data.archive_file.checkins_api.output_base64sha256
  runtime          = "python3.11"
  timeout          = 30

  environment {
    variables = {
      CHECKINS_TABLE       = aws_dynamodb_table.check_ins.name
      COGNITO_API_ENDPOINT = data.terraform_remote_state.cognito.outputs.cognito_api_endpoint
    }
  }
}

# Lambda function: Check In User
resource "aws_lambda_function" "check_in_user" {
  filename         = data.archive_file.checkins_api.output_path
  function_name    = "${var.project_name}-check-in-user"
  role             = aws_iam_role.checkins_lambda_role.arn
  handler          = "check_in_user.handler"
  source_code_hash = data.archive_file.checkins_api.output_base64sha256
  runtime          = "python3.11"
  timeout          = 30

  environment {
    variables = {
      CHECKINS_TABLE       = aws_dynamodb_table.check_ins.name
      COGNITO_API_ENDPOINT = data.terraform_remote_state.cognito.outputs.cognito_api_endpoint
    }
  }
}

# Lambda permissions for API Gateway
resource "aws_lambda_permission" "api_gateway_get_pass" {
  statement_id  = "AllowAPIGatewayInvokeGetPass"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_wallet_pass.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.checkins_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "api_gateway_check_in" {
  statement_id  = "AllowAPIGatewayInvokeCheckIn"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.check_in_user.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.checkins_api.execution_arn}/*/*"
}
