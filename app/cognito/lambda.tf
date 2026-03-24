# ── Lambda Code Packaging ─────────────────────────────────────────────────────

data "archive_file" "post_confirmation" {
  type        = "zip"
  source_file = "${path.module}/auth/post_confirmation.py"
  output_path = "${path.module}/post_confirmation.zip"
}

# ── Post-confirmation Lambda (auto-assigns users to the member group) ──────────

# Data source lookup breaks the circular dependency between the Lambda
# (which needs the pool ID) and the User Pool (which needs the Lambda ARN).
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
