import json
import os
import boto3
from typing import Any, Dict, Optional
from shared import (
    LambdaEvent, LambdaContext, LambdaResponse,
    get_user_info, create_response,
    CalendarItem, Visibility, Status, now_iso,
)

dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get('DYNAMODB_TABLE', 'lantern-lounge-calendar-items')
table = dynamodb.Table(table_name)


def handler(event: LambdaEvent, context: LambdaContext) -> LambdaResponse:
    """Update an existing calendar event. Requires authentication."""
    user = get_user_info(event)

    if not user.is_authenticated:
        return create_response(401, {'error': 'Unauthorized'})

    try:
        path_params: Dict[str, str] = event.get('pathParameters', {}) or {}
        item_id: Optional[str] = path_params.get('id')
        if not item_id:
            return create_response(400, {'error': 'Bad request', 'message': 'Missing item ID'})

        body: Dict[str, Any] = json.loads(event.get('body', '{}'))

        # Fetch existing item
        response = table.get_item(Key={'id': item_id})
        existing_dict = response.get('Item')
        if not existing_dict:
            return create_response(404, {'error': 'Not found', 'message': 'Calendar item not found'})

        existing = CalendarItem.from_dict(existing_dict)

        if not user.is_admin and existing.createdByUserId != user.user_id:
            return create_response(403, {'error': 'Forbidden', 'message': 'You can only update items you created'})

        # Build update expression.
        # ExpressionAttributeNames (#field) are required for reserved keywords
        # (date, status, ...). Using them for every field is simpler than
        # maintaining an allowlist.
        update_expression = "SET #updatedAt = :updatedAt"
        expression_names: Dict[str, str] = {'#updatedAt': 'updatedAt'}
        expression_values: Dict[str, Any] = {':updatedAt': now_iso()}

        allowed_fields = ['title', 'description', 'date', 'visibility', 'status']
        for field in allowed_fields:
            if field not in body:
                continue

            value = body[field]

            if field == 'visibility':
                if not user.is_admin or value not in [v.value for v in Visibility]:
                    value = Visibility.PUBLIC.value

            if field == 'status':
                if not user.is_admin or value not in [v.value for v in Status]:
                    value = existing.status

            update_expression += f", #{field} = :{field}"
            expression_names[f'#{field}'] = field
            expression_values[f':{field}'] = value

        result = table.update_item(
            Key={'id': item_id},
            UpdateExpression=update_expression,
            ExpressionAttributeNames=expression_names,
            ExpressionAttributeValues=expression_values,
            ReturnValues='ALL_NEW'
        )

        updated = CalendarItem.from_dict(result['Attributes'])

        return create_response(200, {
            'message': 'Calendar item updated successfully',
            'item': updated.to_response(),
        })

    except json.JSONDecodeError:
        return create_response(400, {'error': 'Bad request', 'message': 'Invalid JSON in request body'})
    except Exception as e:
        print(f"Error: {str(e)}")
        return create_response(500, {'error': 'Internal server error', 'message': str(e)})
