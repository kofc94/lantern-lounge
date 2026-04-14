# API Gateway HTTP API for the platform
resource "aws_apigatewayv2_api" "main" {
  name          = "lantern-lounge-calendar-api"
  protocol_type = "HTTP"
  description   = "API for Lantern Lounge Calendar"

  cors_configuration {
    allow_origins = [
      "https://${var.www_domain_name}",
      "https://${var.domain_name}",
      "http://localhost:8080"
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

# API Gateway Stage
resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.main.id
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
  name              = "/aws/apigateway/lantern-lounge-calendar-api"
  retention_in_days = 7

  tags = {
    Name        = "API Gateway Logs"
    Environment = var.environment
    Project     = var.project_name
  }
}
