import os
import boto3
from shared import (
    APIGatewayProxyEventV2, Context, APIResponse,
    get_user_info, create_response,
    CalendarItem
)

dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get('DYNAMODB_TABLE', 'lantern-lounge-calendar-items')
table = dynamodb.Table(table_name)


def handler(event: APIGatewayProxyEventV2, context: Context) -> APIResponse:
    """Delete a calendar event. Requires admin or owner status."""
    user = get_user_info(event)

    if not user.is_authenticated:
        return create_response(401, {'error': 'Unauthorized'})

    path_params = event.get('pathParameters') or {}
    item_id = path_params.get('id')

    if not item_id:
        return create_response(400, {'error': 'Bad request', 'message': 'Missing item ID in path'})

    try:
        # Fetch existing item to check ownership
        response = table.get_item(Key={'id': item_id})
        if 'Item' not in response:
            return create_response(404, {'error': 'Not found', 'message': 'Calendar item not found'})

        item_data = response['Item']
        
        # Authorization: only admins or the creator can delete
        if not user.is_admin and item_data.get('createdByUserId') != user.user_id:
            return create_response(403, {'error': 'Forbidden', 'message': 'Not authorized to delete this item'})

        table.delete_item(Key={'id': item_id})

        return create_response(200, {'message': 'Calendar item deleted successfully'})

    except Exception as e:
        print(f"Error: {str(e)}")
        return create_response(500, {'error': 'Internal server error', 'message': str(e)})
