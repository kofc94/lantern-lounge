import json
import os
import boto3
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional, cast
from shared import LambdaEvent, LambdaContext, LambdaResponse, get_user_info, create_response, UserContext, CalendarItem, Visibility

dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get('DYNAMODB_TABLE', 'lantern-lounge-calendar-items')
table = dynamodb.Table(table_name)

def handler(event: LambdaEvent, context: LambdaContext) -> LambdaResponse:
    """
    Create a new calendar item. Requires authentication.
    """
    user: UserContext = get_user_info(event)
    
    if not user.is_authenticated:
        return create_response(401, {'error': 'Unauthorized'})

    try:
        # Parse request body
        body: Dict[str, Any] = json.loads(event.get('body', '{}'))

        # Validate required fields
        required_fields = ['title', 'date']
        for field in required_fields:
            if field not in body:
                return create_response(400, {
                    'error': 'Bad request',
                    'message': f'Missing required field: {field}'
                })

        # Generate unique ID and timestamp
        item_id: str = str(uuid.uuid4())
        timestamp: int = int(datetime.now().timestamp() * 1000)  # Milliseconds

        # Determine visibility
        # Non-admins are forced to PUBLIC
        if user.is_admin:
            visibility = body.get('visibility', Visibility.PUBLIC.value)
            if visibility not in [v.value for v in Visibility]:
                visibility = Visibility.PUBLIC.value
        else:
            visibility = Visibility.PUBLIC.value

        # Create item object
        item = CalendarItem(
            id=item_id,
            timestamp=timestamp,
            title=body['title'],
            description=body.get('description', ''),
            date=body['date'],
            time=body.get('time', ''),
            location=body.get('location', ''),
            visibility=visibility,
            createdBy=user.email or "unknown",
            createdByUserId=user.user_id,
            createdAt=timestamp,
            updatedAt=timestamp
        )

        # Save to DynamoDB
        table.put_item(Item=item.to_dict())

        return create_response(201, {
            'message': 'Calendar item created successfully',
            'item': item
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
