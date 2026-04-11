import json
import os
import boto3
from ulid import ULID
from datetime import datetime
from pydantic import ValidationError
from shared import (
    APIGatewayProxyEventV2, Context, APIResponse,
    get_user_info, create_response,
    CalendarItem, Visibility, Status, now_utc,
    CreateItemRequest
)

dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get('DYNAMODB_TABLE', 'lantern-lounge-calendar-items')
table = dynamodb.Table(table_name)


def handler(event: APIGatewayProxyEventV2, context: Context) -> APIResponse:
    """Create a new calendar event. Requires authentication."""
    user = get_user_info(event)

    if not user.is_authenticated:
        return create_response(401, {'error': 'Unauthorized'})

    try:
        body_str = event.get('body', '{}')
        try:
            request_data = CreateItemRequest.model_validate_json(body_str)
        except ValidationError as ve:
            return create_response(400, {'error': 'Bad request', 'message': f'Validation failed: {ve.errors()}'})

        if user.is_admin:
            visibility = request_data.visibility or Visibility.PUBLIC
            status = Status.APPROVED
        else:
            visibility = Visibility.PUBLIC
            status = Status.PENDING_APPROVAL

        now = now_utc()
        item = CalendarItem(
            id=str(ULID()),
            date=request_data.date,
            title=request_data.title,
            description=request_data.description,
            visibility=visibility,
            status=status,
            created_by=user.name or user.email or 'unknown',
            created_by_user_id=user.user_id,
            created_at=now,
            updated_at=now,
        )

        table.put_item(Item=item.to_dynamo())

        return create_response(201, item.model_dump(by_alias=True))

    except Exception as e:
        print(f"Error: {str(e)}")
        return create_response(500, {'error': 'Internal server error', 'message': str(e)})
