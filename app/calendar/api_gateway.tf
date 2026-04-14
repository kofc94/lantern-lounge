# Cognito JWT Authorizer
resource "aws_apigatewayv2_authorizer" "cognito" {
  api_id           = data.terraform_remote_state.infrastructure.outputs.api_gateway_id
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]
  name             = "cognito-authorizer"

  jwt_configuration {
    audience = [data.terraform_remote_state.cognito.outputs.cognito_user_pool_client_id]
    issuer   = "https://cognito-idp.${var.aws_region}.amazonaws.com/${data.terraform_remote_state.cognito.outputs.cognito_user_pool_id}"
  }
}

# Integration: GET /calendar/items
resource "aws_apigatewayv2_integration" "get_items" {
  api_id                 = data.terraform_remote_state.infrastructure.outputs.api_gateway_id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.get_calendar_items.invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

# Route: GET /calendar/items
resource "aws_apigatewayv2_route" "get_items" {
  api_id    = data.terraform_remote_state.infrastructure.outputs.api_gateway_id
  route_key = "GET /calendar/items"
  target    = "integrations/${aws_apigatewayv2_integration.get_items.id}"
  authorization_type = "NONE"
}

# Integration: POST /calendar/items
resource "aws_apigatewayv2_integration" "create_item" {
  api_id                 = data.terraform_remote_state.infrastructure.outputs.api_gateway_id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.create_calendar_item.invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

# Route: POST /calendar/items
resource "aws_apigatewayv2_route" "create_item" {
  api_id    = data.terraform_remote_state.infrastructure.outputs.api_gateway_id
  route_key = "POST /calendar/items"
  target    = "integrations/${aws_apigatewayv2_integration.create_item.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

# Integration: PUT /calendar/items/{id}
resource "aws_apigatewayv2_integration" "update_item" {
  api_id                 = data.terraform_remote_state.infrastructure.outputs.api_gateway_id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.update_calendar_item.invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

# Route: PUT /calendar/items/{id}
resource "aws_apigatewayv2_route" "update_item" {
  api_id    = data.terraform_remote_state.infrastructure.outputs.api_gateway_id
  route_key = "PUT /calendar/items/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.update_item.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

# Integration: DELETE /calendar/items/{id}
resource "aws_apigatewayv2_integration" "delete_item" {
  api_id                 = data.terraform_remote_state.infrastructure.outputs.api_gateway_id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.delete_calendar_item.invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

# Route: DELETE /calendar/items/{id}
resource "aws_apigatewayv2_route" "delete_item" {
  api_id    = data.terraform_remote_state.infrastructure.outputs.api_gateway_id
  route_key = "DELETE /calendar/items/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.delete_item.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}
