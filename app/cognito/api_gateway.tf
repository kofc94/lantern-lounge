# API Gateway HTTP API for User Management
resource "aws_apigatewayv2_api" "users_api" {
  name          = "${var.project_name}-users-api"
  protocol_type = "HTTP"
  description   = "API for Lantern Lounge User Management"

  cors_configuration {
    allow_origins = [
      "https://${local.www_domain_name}",
      "https://${local.domain_name}",
      "http://localhost:5173", # Vite default
      "http://localhost:8080"  # Alternative local
    ]
    allow_methods = ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"]
    allow_headers = ["Content-Type", "Authorization"]
    max_age       = 300
  }

  tags = {
    Name        = "Lantern Lounge Users API"
    Environment = var.environment
    Project     = var.project_name
  }
}

# Cognito JWT Authorizer
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

# API Gateway Stage
resource "aws_apigatewayv2_stage" "users_default" {
  api_id      = aws_apigatewayv2_api.users_api.id
  name        = "$default"
  auto_deploy = true
}

# Integration: GET /users
resource "aws_apigatewayv2_integration" "get_users" {
  api_id                 = aws_apigatewayv2_api.users_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.user_management.invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

# Route: GET /users
resource "aws_apigatewayv2_route" "get_users" {
  api_id    = aws_apigatewayv2_api.users_api.id
  route_key = "GET /users"
  target    = "integrations/${aws_apigatewayv2_integration.get_users.id}"

  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.users_cognito.id
}

# Integration: PATCH /users/{username}
resource "aws_apigatewayv2_integration" "update_user_groups" {
  api_id                 = aws_apigatewayv2_api.users_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.user_management.invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

# Route: PATCH /users/{username}
resource "aws_apigatewayv2_route" "update_user_groups" {
  api_id    = aws_apigatewayv2_api.users_api.id
  route_key = "PATCH /users/{username}"
  target    = "integrations/${aws_apigatewayv2_integration.update_user_groups.id}"

  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.users_cognito.id
}
