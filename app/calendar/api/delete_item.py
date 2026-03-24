import json
import os
import boto3
from typing import Any, Dict, List, Optional, cast
from boto3.dynamodb.conditions import Key
from shared import LambdaEvent, LambdaContext, LambdaResponse, get_user_info, create_response, UserContext

localstack_hostname = os.environ.get('LOCALSTACK_HOSTNAME')
if localstack_hostname:
    dynamodb = boto3.resource('dynamodb', endpoint_url=f'http://{localstack_hostname}:4566')
else:
    dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get('DYNAMODB_TABLE', 'lantern-lounge-calendar-items')
table = dynamodb.Table(table_name)

def handler(event: LambdaEvent, context: LambdaContext) -> LambdaResponse:
    """
    Delete a calendar item. Requires authentication.
    Users can only delete items they created.
    """
    user: UserContext = get_user_info(event)
    
    if not user.is_authenticated:
        return create_response(401, {'error': 'Unauthorized'})

    try:
        # Get item ID from path parameters
        path_params: Dict[str, str] = event.get('pathParameters', {}) or {}
        item_id: Optional[str] = path_params.get('id')

        if not item_id:
            return create_response(400, {
                'error': 'Bad request',
                'message': 'Missing item ID'
            })

        # First, get the existing item to verify ownership
        response = table.query(
            KeyConditionExpression=Key('id').eq(item_id)
        )

        items: List[Dict[str, Any]] = response.get('Items', [])
        if not items:
            return create_response(404, {
                'error': 'Not found',
                'message': 'Calendar item not found'
            })

        existing_item = items[0]

        # Verify ownership (Admins can delete anything)
        if not user.is_admin and existing_item.get('createdByUserId') != user.user_id:
            return create_response(403, {
                'error': 'Forbidden',
                'message': 'You can only delete items you created'
            })

        # Delete the item
        table.delete_item(
            Key={
                'id': item_id,
                'timestamp': existing_item['timestamp']
            }
        )

        return create_response(200, {
            'message': 'Calendar item deleted successfully',
            'itemId': item_id
        })

    except Exception as e:
        print(f"Error: {str(e)}")
        return create_response(500, {
            'error': 'Internal server error',
            'message': str(e)
        })
