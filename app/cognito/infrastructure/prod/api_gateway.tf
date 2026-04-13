# API Gateway HTTP API for Cognito Service
resource "aws_apigatewayv2_api" "cognito_api" {
  name          = "${var.project_name}-cognito-api"
  protocol_type = "HTTP"
  description   = "Internal API for Cognito User Management"

  cors_configuration {
    allow_origins = ["*"] # Internal/Staff use
    allow_methods = ["GET", "POST", "OPTIONS"]
    allow_headers = ["Content-Type", "Authorization"]
    max_age       = 300
  }

  tags = {
    Name        = "Lantern Lounge Cognito API"
    Environment = var.environment
    Project     = var.project_name
  }
}

# API Gateway Stage
resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.cognito_api.id
  name        = "$default"
  auto_deploy = true
}

# Integration: GET /validate-user
resource "aws_apigatewayv2_integration" "validate_user" {
  api_id                 = aws_apigatewayv2_api.cognito_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.validate_user.invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

# Route: GET /validate-user
# Note: For simplicity, we're not adding a JWT authorizer here yet, 
# but in production, we should restrict this to authenticated staff/internal services.
resource "aws_apigatewayv2_route" "validate_user" {
  api_id    = aws_apigatewayv2_api.cognito_api.id
  route_key = "GET /validate-user"
  target    = "integrations/${aws_apigatewayv2_integration.validate_user.id}"
}

# ── Users API (Admin user management) ────────────────────────────────────────

resource "aws_apigatewayv2_api" "users_api" {
  name          = "${var.project_name}-users-api"
  protocol_type = "HTTP"
  description   = "API for Lantern Lounge User Management"

  cors_configuration {
    allow_origins = [
      "https://${local.www_domain_name}",
      "https://${local.domain_name}",
      "http://localhost:5173",
    ]
    allow_methods = ["GET", "PATCH", "OPTIONS"]
    allow_headers = ["Content-Type", "Authorization"]
    max_age       = 300
  }

  tags = {
    Name        = "Lantern Lounge Users API"
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_apigatewayv2_stage" "users_default" {
  api_id      = aws_apigatewayv2_api.users_api.id
  name        = "$default"
  auto_deploy = true
}

resource "aws_apigatewayv2_authorizer" "users_cognito" {
  api_id           = aws_apigatewayv2_api.users_api.id
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]
  name             = "users-cognito-authorizer"

  jwt_configuration {
    audience = [aws_cognito_user_pool_client.calendar_app.id]
    issuer   = "https://cognito-idp.${var.aws_region}.amazonaws.com/${aws_cognito_user_pool.calendar_users.id}"
  }
}

resource "aws_apigatewayv2_integration" "get_users" {
  api_id                 = aws_apigatewayv2_api.users_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.user_management.invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "get_users" {
  api_id    = aws_apigatewayv2_api.users_api.id
  route_key = "GET /users"
  target    = "integrations/${aws_apigatewayv2_integration.get_users.id}"

  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.users_cognito.id
}

resource "aws_apigatewayv2_integration" "patch_user" {
  api_id                 = aws_apigatewayv2_api.users_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.user_management.invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "patch_user" {
  api_id    = aws_apigatewayv2_api.users_api.id
  route_key = "PATCH /users/{username}"
  target    = "integrations/${aws_apigatewayv2_integration.patch_user.id}"

  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.users_cognito.id
}
