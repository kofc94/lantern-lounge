# API Gateway HTTP API for Check-ins
resource "aws_apigatewayv2_api" "checkins_api" {
  name          = "${var.project_name}-checkins-api"
  protocol_type = "HTTP"
  description   = "API for Lantern Lounge Check-ins"

  cors_configuration {
    allow_origins = [
      "https://${local.www_domain_name}",
      "https://${local.domain_name}",
      "https://checkin.lanternlounge.org",
      "http://localhost:5173",
      "http://localhost:5174"
    ]
    allow_methods = ["GET", "POST", "OPTIONS"]
    allow_headers = ["Content-Type", "Authorization"]
    max_age       = 300
  }

  tags = {
    Name        = "Lantern Lounge Check-ins API"
    Environment = var.environment
    Project     = var.project_name
  }
}

# Cognito JWT Authorizer
resource "aws_apigatewayv2_authorizer" "cognito" {
  api_id           = aws_apigatewayv2_api.checkins_api.id
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]
  name             = "cognito-authorizer"

  jwt_configuration {
    audience = [data.terraform_remote_state.cognito.outputs.cognito_user_pool_client_id]
    issuer   = "https://cognito-idp.${var.aws_region}.amazonaws.com/${data.terraform_remote_state.cognito.outputs.cognito_user_pool_id}"
  }
}

# API Gateway Stage
resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.checkins_api.id
  name        = "$default"
  auto_deploy = true
}

# Integration: GET /wallet/pass
resource "aws_apigatewayv2_integration" "get_pass" {
  api_id                 = aws_apigatewayv2_api.checkins_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.get_wallet_pass.invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

# Route: GET /wallet/pass (AUTH required)
resource "aws_apigatewayv2_route" "get_pass" {
  api_id    = aws_apigatewayv2_api.checkins_api.id
  route_key = "GET /wallet/pass"
  target    = "integrations/${aws_apigatewayv2_integration.get_pass.id}"

  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

# Integration: GET /wallet/apple
resource "aws_apigatewayv2_integration" "get_apple_pass" {
  api_id                 = aws_apigatewayv2_api.checkins_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.get_apple_wallet_pass.invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

# Route: GET /wallet/apple (AUTH required)
resource "aws_apigatewayv2_route" "get_apple_pass" {
  api_id    = aws_apigatewayv2_api.checkins_api.id
  route_key = "GET /wallet/apple"
  target    = "integrations/${aws_apigatewayv2_integration.get_apple_pass.id}"

  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

# Integration: POST /checkin (email)
resource "aws_apigatewayv2_integration" "check_in" {
  api_id                 = aws_apigatewayv2_api.checkins_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.check_in_user.invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

# Route: POST /checkin (AUTH required)
resource "aws_apigatewayv2_route" "check_in" {
  api_id    = aws_apigatewayv2_api.checkins_api.id
  route_key = "POST /checkin"
  target    = "integrations/${aws_apigatewayv2_integration.check_in.id}"

  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

# Integration: POST /checkin/scan (Zeffy QR)
resource "aws_apigatewayv2_integration" "check_in_by_scan" {
  api_id                 = aws_apigatewayv2_api.checkins_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.check_in_by_scan.invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

# Route: POST /checkin/scan (AUTH required)
resource "aws_apigatewayv2_route" "check_in_by_scan" {
  api_id    = aws_apigatewayv2_api.checkins_api.id
  route_key = "POST /checkin/scan"
  target    = "integrations/${aws_apigatewayv2_integration.check_in_by_scan.id}"

  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}
