# ── Lambda Code Packaging ─────────────────────────────────────────────────────

data "archive_file" "post_confirmation" {
  type        = "zip"
  source_file = "${path.module}/auth/post_confirmation.py"
  output_path = "${path.module}/post_confirmation.zip"
}

data "archive_file" "user_management" {
  type        = "zip"
  source_dir  = "${path.module}/api"
  output_path = "${path.module}/user_management.zip"
}

# ── User Pool Lookup ─────────────────────────────────────────────────────────

# Using a data source breaks the circular dependency between the User Pool
# (which needs Lambda ARNs for triggers) and the Lambdas (which need the Pool ID).
data "aws_cognito_user_pools" "main" {
  name = aws_cognito_user_pool.calendar_users.name
}

# ── Post-confirmation Lambda (auto-assigns users to the limited group) ────────

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

resource "aws_iam_role_policy" "post_confirmation_basic" {
  name = "${var.project_name}-post-confirmation-basic"
  role = aws_iam_role.post_confirmation_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ]
      Resource = "*"
    }]
  })
}

resource "aws_iam_role_policy" "post_confirmation_cognito" {
  name = "${var.project_name}-post-confirmation-cognito"
  role = aws_iam_role.post_confirmation_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "cognito-idp:AdminAddUserToGroup",
        "cognito-idp:AdminUpdateUserAttributes"
      ]
      Resource = aws_cognito_user_pool.calendar_users.arn
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

  # USER_POOL_ID environment variable is removed to break circular dependency.
  # The Lambda extracts the userPoolId directly from the trigger event.

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
  source_arn    = aws_cognito_user_pool.calendar_users.arn
}

# ── User Management Lambda (Admin users only) ───────────────────────────────

resource "aws_iam_role" "user_management_role" {
  name = "${var.project_name}-user-management-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "user_management_basic" {
  name = "${var.project_name}-user-management-basic"
  role = aws_iam_role.user_management_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ]
      Resource = "*"
    }]
  })
}

resource "aws_iam_role_policy" "user_management_cognito" {
  name = "${var.project_name}-user-management-cognito"
  role = aws_iam_role.user_management_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cognito-idp:ListUsers",
          "cognito-idp:AdminListGroupsForUser",
          "cognito-idp:AdminAddUserToGroup",
          "cognito-idp:AdminRemoveUserFromGroup",
          "cognito-idp:AdminUpdateUserAttributes"
        ]
        Resource = aws_cognito_user_pool.calendar_users.arn
      }
    ]
  })
}

resource "aws_lambda_function" "user_management" {
  filename         = data.archive_file.user_management.output_path
  function_name    = "${var.project_name}-user-management"
  role             = aws_iam_role.user_management_role.arn
  handler          = "users.handler"
  source_code_hash = data.archive_file.user_management.output_base64sha256
  runtime          = "python3.11"
  timeout          = 30

  environment {
    variables = {
      USER_POOL_ID = tolist(data.aws_cognito_user_pools.main.ids)[0]
    }
  }

  tags = {
    Name        = "User Management"
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_lambda_permission" "api_gateway_users" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.user_management.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.users_api.execution_arn}/*/*"
}
