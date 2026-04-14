# ── Lambda Code Packaging ─────────────────────────────────────────────────────

data "archive_file" "user_management" {
  type        = "zip"
  source_dir  = "${path.module}/api"
  output_path = "${path.module}/user_management.zip"
}

# ── Dependencies Lambda Layer (Pydantic) ──────────────────────────────────────

data "archive_file" "cognito_deps_layer" {
  type        = "zip"
  source_dir  = "${path.module}/.layer"
  output_path = "${path.module}/cognito-deps-layer.zip"
}

resource "aws_lambda_layer_version" "cognito_deps" {
  layer_name          = "${var.project_name}-cognito-deps"
  filename            = data.archive_file.cognito_deps_layer.output_path
  source_code_hash    = data.archive_file.cognito_deps_layer.output_base64sha256
  compatible_runtimes = ["python3.11"]
}

data "archive_file" "post_confirmation" {
  type        = "zip"
  source_file = "${path.module}/auth/post_confirmation.py"
  output_path = "${path.module}/post_confirmation.zip"
}

# ── Post-confirmation Lambda (auto-assigns users to the member group) ──────────

# Data source lookup breaks the circular dependency: the User Pool (cognito.tf)
# references the Lambda ARN via lambda_config, so the Lambda cannot reference the
# User Pool resource directly without creating a cycle.
#
# On a fresh environment the pool doesn't exist yet when this data source runs,
# so callers must use try() with an appropriate fallback (see below).
data "aws_cognito_user_pools" "main" {
  name = "${var.project_name}-calendar-users"
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
      # Falls back to the resource ARN on first apply when the pool doesn't exist yet.
      # aws_iam_role_policy → aws_cognito_user_pool is safe (no cycle via this path).
      Resource = try(tolist(data.aws_cognito_user_pools.main.arns)[0], aws_cognito_user_pool.calendar_users.arn)
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
  layers           = [aws_lambda_layer_version.cognito_deps.arn]

  environment {
    variables = {
      # Falls back to "" on first apply (pool not yet created). Cannot use
      # aws_cognito_user_pool.calendar_users.id here — that would be a cycle since
      # the User Pool already depends on this Lambda via lambda_config.
      # A second apply will set the correct value once the pool exists.
      USER_POOL_ID = try(tolist(data.aws_cognito_user_pools.main.ids)[0], "")
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
  # Falls back to the resource ARN on first apply — same reasoning as the IAM policy above.
  source_arn    = try(tolist(data.aws_cognito_user_pools.main.arns)[0], aws_cognito_user_pool.calendar_users.arn)
}

data "archive_file" "pre_authentication" {
  type        = "zip"
  source_file = "${path.module}/auth/pre_authentication.py"
  output_path = "${path.module}/pre_authentication.zip"
}

# ── Pre-authentication Lambda (blocks non-staff from staff-app client) ───────

resource "aws_iam_role" "pre_authentication_role" {
  name = "${var.project_name}-pre-authentication-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "pre_authentication_basic" {
  role       = aws_iam_role.pre_authentication_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "pre_authentication_cognito" {
  name = "${var.project_name}-pre-authentication-cognito"
  role = aws_iam_role.pre_authentication_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = [
        "cognito-idp:AdminListGroupsForUser",
        "cognito-idp:ListUserPoolClients"
      ]
      Resource = try(tolist(data.aws_cognito_user_pools.main.arns)[0], aws_cognito_user_pool.calendar_users.arn)
    }]
  })
}

resource "aws_lambda_function" "pre_authentication" {
  filename         = data.archive_file.pre_authentication.output_path
  function_name    = "${var.project_name}-pre-authentication"
  role             = aws_iam_role.pre_authentication_role.arn
  handler          = "pre_authentication.handler"
  source_code_hash = data.archive_file.pre_authentication.output_base64sha256
  runtime          = "python3.11"
  timeout          = 10
  layers           = [aws_lambda_layer_version.cognito_deps.arn]

  environment {
    variables = {
      USER_POOL_ID      = try(tolist(data.aws_cognito_user_pools.main.ids)[0], "")
    }
  }
}

resource "aws_lambda_permission" "cognito_pre_authentication" {
  statement_id  = "AllowCognitoInvokePreAuth"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.pre_authentication.function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = try(tolist(data.aws_cognito_user_pools.main.arns)[0], aws_cognito_user_pool.calendar_users.arn)
}

data "archive_file" "validate_user" {
  type        = "zip"
  source_file = "${path.module}/auth/validate_user.py"
  output_path = "${path.module}/validate_user.zip"
}

# ── Validate User Lambda (Internal use only) ──────────────────────────────────

resource "aws_iam_role" "validate_user_role" {
  name = "${var.project_name}-validate-user-role"

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

resource "aws_iam_role_policy_attachment" "validate_user_basic" {
  role       = aws_iam_role.validate_user_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "validate_user_cognito" {
  name = "${var.project_name}-validate-user-cognito"
  role = aws_iam_role.validate_user_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "cognito-idp:ListUsers"
      Resource = aws_cognito_user_pool.calendar_users.arn
    }]
  })
}

resource "aws_lambda_function" "validate_user" {
  filename         = data.archive_file.validate_user.output_path
  function_name    = "${var.project_name}-validate-user"
  role             = aws_iam_role.validate_user_role.arn
  handler          = "validate_user.handler"
  source_code_hash = data.archive_file.validate_user.output_base64sha256
  runtime          = "python3.11"
  timeout          = 10
  layers           = [aws_lambda_layer_version.cognito_deps.arn]

  environment {
    variables = {
      USER_POOL_ID = aws_cognito_user_pool.calendar_users.id
    }
  }

  tags = {
    Name        = "Validate User"
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_lambda_permission" "api_gateway_validate_user" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.validate_user.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.cognito_api.execution_arn}/*/*"
}

# ── User Management Lambda (Admin only) ───────────────────────────────────────

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

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
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
    Statement = [{
      Effect = "Allow"
      Action = [
        "cognito-idp:ListUsers",
        "cognito-idp:ListUsersInGroup",
        "cognito-idp:AdminListGroupsForUser",
        "cognito-idp:AdminAddUserToGroup",
        "cognito-idp:AdminRemoveUserFromGroup",
      ]
      Resource = aws_cognito_user_pool.calendar_users.arn
    }]
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
  layers           = [aws_lambda_layer_version.cognito_deps.arn]

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

