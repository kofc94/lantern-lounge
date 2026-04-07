import json
import os
import boto3
from typing import Any, Dict, Optional
from shared import LambdaEvent, LambdaContext, LambdaResponse, get_user_info, create_response

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

        # Fetch existing item to verify ownership before deleting
        response = table.get_item(Key={'id': item_id})
        existing_item = response.get('Item')
        if not existing_item:
            return create_response(404, {
                'error': 'Not found',
                'message': 'Calendar item not found'
            })

        # Verify ownership (admins can delete anything)
        if not user.is_admin and existing_item.get('createdByUserId') != user.user_id:
            return create_response(403, {
                'error': 'Forbidden',
                'message': 'You can only delete items you created'
            })

        table.delete_item(Key={'id': item_id})

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
