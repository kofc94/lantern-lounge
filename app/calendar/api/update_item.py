import json
import os
import boto3
from datetime import datetime
from typing import Any, Dict, List, Optional, cast
from boto3.dynamodb.conditions import Key
from shared import LambdaEvent, LambdaContext, LambdaResponse, get_user_info, create_response, UserContext, Visibility, Status, CalendarItem

localstack_hostname = os.environ.get('LOCALSTACK_HOSTNAME')
if localstack_hostname:
    dynamodb = boto3.resource('dynamodb', endpoint_url=f'http://{localstack_hostname}:4566')
else:
    dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get('DYNAMODB_TABLE', 'lantern-lounge-calendar-items')
table = dynamodb.Table(table_name)

def handler(event: LambdaEvent, context: LambdaContext) -> LambdaResponse:
    """
    Update an existing calendar item. Requires authentication.
    Users can only update items they created.
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

        # Parse request body
        body: Dict[str, Any] = json.loads(event.get('body', '{}'))

        # First, get the existing item to verify ownership
        response = table.query(
            KeyConditionExpression=Key('id').eq(item_id)
        )

        db_items: List[Dict[str, Any]] = response.get('Items', [])
        if not db_items:
            return create_response(404, {
                'error': 'Not found',
                'message': 'Calendar item not found'
            })

        # Use CalendarItem for consistency
        existing_item = CalendarItem.from_dict(db_items[0])

        # Verify ownership (Admins can update anything)
        if not user.is_admin and existing_item.createdByUserId != user.user_id:
            return create_response(403, {
                'error': 'Forbidden',
                'message': 'You can only update items you created'
            })

        # Build update expression.
        # ExpressionAttributeNames (#field) are required for any attribute whose
        # name is a DynamoDB reserved keyword (date, time, location, status, ...).
        # Using them for every field is simpler than maintaining an allowlist.
        update_expression = "SET #updatedAt = :updatedAt"
        expression_names: Dict[str, str] = {'#updatedAt': 'updatedAt'}
        expression_values: Dict[str, Any] = {
            ':updatedAt': int(datetime.now().timestamp() * 1000)
        }

        # Update allowed fields
        allowed_fields = ['title', 'description', 'date', 'time', 'location', 'visibility', 'status']
        for field in allowed_fields:
            if field in body:
                value = body[field]

                # Rule: Only admins can change/set visibility to PRIVATE or change status
                if field == 'visibility':
                    if not user.is_admin or value not in [v.value for v in Visibility]:
                        value = Visibility.PUBLIC.value

                if field == 'status':
                    if not user.is_admin or value not in [v.value for v in Status]:
                        value = existing_item.status # Preserve current status if non-admin tries to change it

                update_expression += f", #{field} = :{field}"
                expression_names[f'#{field}'] = field
                expression_values[f':{field}'] = value

        # Update the item
        update_response = table.update_item(
            Key={
                'id': item_id,
                'timestamp': existing_item.timestamp
            },
            UpdateExpression=update_expression,
            ExpressionAttributeNames=expression_names,
            ExpressionAttributeValues=expression_values,
            ReturnValues='ALL_NEW'
        )

        # Return the updated item as a proper object
        updated_item = CalendarItem.from_dict(update_response['Attributes'])

        return create_response(200, {
            'message': 'Calendar item updated successfully',
            'item': updated_item
        })

    except json.JSONDecodeError:
        return create_response(400, {
            'error': 'Bad request',
            'message': 'Invalid JSON in request body'
        })
    except Exception as e:
        print(f"Error: {str(e)}")
        return create_response(500, {
            'error': 'Internal server error',
            'message': str(e)
        })
