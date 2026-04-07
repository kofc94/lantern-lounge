# ── Lambda Code Packaging ─────────────────────────────────────────────────────

data "archive_file" "checkins_api" {
  type        = "zip"
  source_dir  = "${path.module}/api"
  output_path = "${path.module}/checkins-api.zip"
}

# ── Wallet Lambda Layer (PyJWT + cryptography) ────────────────────────────────

data "archive_file" "wallet_deps_layer" {
  type        = "zip"
  source_dir  = "${path.module}/.layer"
  output_path = "${path.module}/wallet-deps-layer.zip"
}

resource "aws_lambda_layer_version" "wallet_deps" {
  layer_name          = "${var.project_name}-wallet-deps"
  filename            = data.archive_file.wallet_deps_layer.output_path
  source_code_hash    = data.archive_file.wallet_deps_layer.output_base64sha256
  compatible_runtimes = ["python3.11"]
}

data "aws_caller_identity" "current" {}

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

# SSM parameter holding Lambda config as JSON
resource "aws_ssm_parameter" "checkins_config" {
  name  = "/${var.project_name}/check-ins/config"
  type  = "String"
  value = jsonencode({
    checkins_table       = aws_dynamodb_table.check_ins.name
    non_members_table    = aws_dynamodb_table.non_members.name
    cognito_api_endpoint = data.terraform_remote_state.cognito.outputs.cognito_api_endpoint
  })

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

# IAM policy for DynamoDB and SSM access
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
          "${aws_dynamodb_table.check_ins.arn}/index/*",
          aws_dynamodb_table.non_members.arn
        ]
      },
      {
        Effect   = "Allow"
        Action   = "ssm:GetParameter"
        Resource = aws_ssm_parameter.checkins_config.arn
      },
      {
        Effect = "Allow"
        Action = "ssm:GetParameter"
        Resource = [
          "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/lantern-lounge/google/wallet-service-account-key",
          "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/lantern-lounge/google/wallet-issuer-id"
        ]
      },
      {
        Effect   = "Allow"
        Action   = "kms:Decrypt"
        Resource = "arn:aws:kms:${var.aws_region}:${data.aws_caller_identity.current.account_id}:alias/aws/ssm"
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
  layers           = [aws_lambda_layer_version.wallet_deps.arn]

  environment {
    variables = {
      CHECKINS_TABLE       = aws_dynamodb_table.check_ins.name
      COGNITO_API_ENDPOINT = data.terraform_remote_state.cognito.outputs.cognito_api_endpoint
    }
  }
}

# Lambda function: Check In User (email)
resource "aws_lambda_function" "check_in_user" {
  filename         = data.archive_file.checkins_api.output_path
  function_name    = "${var.project_name}-check-in-user"
  role             = aws_iam_role.checkins_lambda_role.arn
  handler          = "check_in_user.handler"
  source_code_hash = data.archive_file.checkins_api.output_base64sha256
  runtime          = "python3.11"
  timeout          = 30
}

# Lambda function: Check In By Scan (Zeffy QR)
resource "aws_lambda_function" "check_in_by_scan" {
  filename         = data.archive_file.checkins_api.output_path
  function_name    = "${var.project_name}-check-in-by-scan"
  role             = aws_iam_role.checkins_lambda_role.arn
  handler          = "check_in_by_scan.handler"
  source_code_hash = data.archive_file.checkins_api.output_base64sha256
  runtime          = "python3.11"
  timeout          = 30
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

resource "aws_lambda_permission" "api_gateway_check_in_by_scan" {
  statement_id  = "AllowAPIGatewayInvokeCheckInByScan"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.check_in_by_scan.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.checkins_api.execution_arn}/*/*"
}
