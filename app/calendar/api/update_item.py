import json
import os
import boto3
from pydantic import ValidationError
from shared import (
    APIGatewayProxyEventV2, Context, APIResponse,
    get_user_info, create_response,
    CalendarItem, Visibility, Status, now_utc,
    UpdateItemRequest
)

dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get('DYNAMODB_TABLE', 'lantern-lounge-calendar-items')
table = dynamodb.Table(table_name)


def handler(event: APIGatewayProxyEventV2, context: Context) -> APIResponse:
    """Update an existing calendar event. Requires authentication."""
    user = get_user_info(event)

    if not user.is_authenticated:
        return create_response(401, {'error': 'Unauthorized'})

    path_params = event.get('pathParameters') or {}
    item_id = path_params.get('id')

    if not item_id:
        return create_response(400, {'error': 'Bad request', 'message': 'Missing item ID in path'})

    try:
        # Fetch existing item
        response = table.get_item(Key={'id': item_id})
        if 'Item' not in response:
            return create_response(404, {'error': 'Not found', 'message': 'Calendar item not found'})

        existing_data = response['Item']
        item = CalendarItem.model_validate(existing_data)

        # Authorization: only admins or the creator can update
        if not user.is_admin and item.created_by_user_id != user.user_id:
            return create_response(403, {'error': 'Forbidden', 'message': 'Not authorized to update this item'})

        body_str = event.get('body', '{}')
        try:
            update_data = UpdateItemRequest.model_validate_json(body_str)
        except ValidationError as ve:
            return create_response(400, {'error': 'Bad request', 'message': f'Validation failed: {ve.errors()}'})

        # Apply updates
        if update_data.title is not None:
            item.title = update_data.title
        if update_data.date is not None:
            item.date = update_data.date
        if update_data.description is not None:
            item.description = update_data.description
        
        # Admin-only updates
        if user.is_admin:
            if update_data.visibility is not None:
                item.visibility = update_data.visibility
            if update_data.status is not None:
                item.status = update_data.status

        item.updated_at = now_utc()

        table.put_item(Item=item.to_dynamo())

        return create_response(200, item.model_dump(by_alias=True))

    except Exception as e:
        print(f"Error: {str(e)}")
        return create_response(500, {'error': 'Internal server error', 'message': str(e)})
