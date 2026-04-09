import json
import os
import uuid
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
    """Create a new calendar event. Requires authentication."""
    user = get_user_info(event)

    if not user.is_authenticated:
        return create_response(401, {'error': 'Unauthorized'})

    try:
        body: Dict[str, Any] = json.loads(event.get('body', '{}'))

        for field in ['title', 'date']:
            if field not in body:
                return create_response(400, {
                    'error': 'Bad request',
                    'message': f'Missing required field: {field}'
                })

        if user.is_admin:
            visibility = body.get('visibility', Visibility.PUBLIC.value)
            if visibility not in [v.value for v in Visibility]:
                visibility = Visibility.PUBLIC.value
            status = Status.APPROVED.value
        else:
            visibility = Visibility.PUBLIC.value
            status = Status.PENDING_APPROVAL.value

        now = now_iso()
        item = CalendarItem(
            id=str(uuid.uuid4()),
            date=body['date'],
            title=body['title'],
            description=body.get('description', ''),
            visibility=visibility,
            status=status,
            createdBy=user.email or 'unknown',
            createdByUserId=user.user_id,
            createdAt=now,
            updatedAt=now,
        )

        table.put_item(Item=item.to_dict())

        return create_response(201, {
            'message': 'Calendar item created successfully',
            'item': item.to_response(),
        })

    except json.JSONDecodeError:
        return create_response(400, {'error': 'Bad request', 'message': 'Invalid JSON in request body'})
    except Exception as e:
        print(f"Error: {str(e)}")
        return create_response(500, {'error': 'Internal server error', 'message': str(e)})
