# API Gateway HTTP API for Calendar
resource "aws_apigatewayv2_api" "calendar_api" {
  name          = "${var.project_name}-calendar-api"
  protocol_type = "HTTP"
  description   = "API for Lantern Lounge Calendar"

  cors_configuration {
    allow_origins = [
      "https://${local.www_domain_name}",
      "https://${local.domain_name}",
      "http://localhost:8080" # For local testing
    ]
    allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_headers = ["Content-Type", "Authorization", "X-Amz-Date", "X-Api-Key", "X-Amz-Security-Token"]
    max_age       = 300
  }

  tags = {
    Name        = "Lantern Lounge Calendar API"
    Environment = var.environment
    Project     = var.project_name
  }
}

# Cognito JWT Authorizer
resource "aws_apigatewayv2_authorizer" "cognito" {
  api_id           = aws_apigatewayv2_api.calendar_api.id
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]
  name             = "cognito-authorizer"

  jwt_configuration {
    audience = [aws_cognito_user_pool_client.calendar_app.id]
    issuer   = "https://cognito-idp.${var.aws_region}.amazonaws.com/${aws_cognito_user_pool.calendar_users.id}"
  }
}

# API Gateway Stage
resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.calendar_api.id
  name        = "$default"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway_logs.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      routeKey       = "$context.routeKey"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
      errorMessage   = "$context.error.message"
      authError      = "$context.authorizer.error"
    })
  }

  tags = {
    Name        = "Default Stage"
    Environment = var.environment
    Project     = var.project_name
  }
}

# CloudWatch Log Group for API Gateway
resource "aws_cloudwatch_log_group" "api_gateway_logs" {
  name              = "/aws/apigateway/${var.project_name}-calendar-api"
  retention_in_days = 7 # Keep logs for 7 days to minimize costs

  tags = {
    Name        = "API Gateway Logs"
    Environment = var.environment
    Project     = var.project_name
  }
}

# Integration: GET /calendar/items
resource "aws_apigatewayv2_integration" "get_items" {
  api_id                 = aws_apigatewayv2_api.calendar_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.get_calendar_items.invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

# Route: GET /calendar/items (NO auth required - returns public or all based on auth)
resource "aws_apigatewayv2_route" "get_items" {
  api_id    = aws_apigatewayv2_api.calendar_api.id
  route_key = "GET /calendar/items"
  target    = "integrations/${aws_apigatewayv2_integration.get_items.id}"

  # No authorizer - Lambda will check if user is authenticated
  authorization_type = "NONE"
}

# Integration: POST /calendar/items
resource "aws_apigatewayv2_integration" "create_item" {
  api_id                 = aws_apigatewayv2_api.calendar_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.create_calendar_item.invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

# Route: POST /calendar/items (AUTH required)
resource "aws_apigatewayv2_route" "create_item" {
  api_id    = aws_apigatewayv2_api.calendar_api.id
  route_key = "POST /calendar/items"
  target    = "integrations/${aws_apigatewayv2_integration.create_item.id}"

  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

# Integration: PUT /calendar/items/{id}
resource "aws_apigatewayv2_integration" "update_item" {
  api_id                 = aws_apigatewayv2_api.calendar_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.update_calendar_item.invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

# Route: PUT /calendar/items/{id} (AUTH required)
resource "aws_apigatewayv2_route" "update_item" {
  api_id    = aws_apigatewayv2_api.calendar_api.id
  route_key = "PUT /calendar/items/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.update_item.id}"

  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

# Integration: DELETE /calendar/items/{id}
resource "aws_apigatewayv2_integration" "delete_item" {
  api_id                 = aws_apigatewayv2_api.calendar_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.delete_calendar_item.invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

# Route: DELETE /calendar/items/{id} (AUTH required)
resource "aws_apigatewayv2_route" "delete_item" {
  api_id    = aws_apigatewayv2_api.calendar_api.id
  route_key = "DELETE /calendar/items/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.delete_item.id}"

  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}
