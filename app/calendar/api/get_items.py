import json
import os
import boto3
import calendar
from datetime import datetime
from typing import Any, Dict, List, Optional
from boto3.dynamodb.conditions import Key
from shared import (
    APIGatewayProxyEventV2, Context, APIResponse,
    get_user_info, create_response,
    Visibility, CalendarItem
)

dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get('DYNAMODB_TABLE', 'lantern-lounge-calendar-items')
table = dynamodb.Table(table_name)

def handler(event: APIGatewayProxyEventV2, context: Context) -> APIResponse:
    """
    Get calendar items. Returns all items in the specified date range.
    Transforms data based on authentication and visibility rules.
    """
    user = get_user_info(event)
    
    try:
        # Query parameters for date filtering (optional)
        query_params = event.get('queryStringParameters') or {}
        
        # Default to first and last day of current month if not provided
        now = datetime.now()
        current_year = now.year
        current_month = now.month
        last_day = calendar.monthrange(current_year, current_month)[1]

        start_date: str = query_params.get('startDate') or f"{current_year}-{current_month:02d}-01"
        end_date: str = query_params.get('endDate') or f"{current_year}-{current_month:02d}-{last_day:02d}"

        # Query all items in the range using the refined ItemsByDate GSI
        response = table.query(
            IndexName='ItemsByDate',
            KeyConditionExpression=Key('gsipk').eq('EVENT') & Key('date').between(start_date, end_date)
        )

        db_items: List[Dict[str, Any]] = response.get('Items', [])
        transformed_items: List[Dict[str, Any]] = []

        for item_dict in db_items:
            item = CalendarItem.model_validate(item_dict)

            # Rule 1: Private event — hide details from non-admins
            if item.visibility == Visibility.PRIVATE and not user.is_admin:
                item.title = "Date unavailable"
                item.description = ""

            # Rule 2: Unauthenticated — hide creator info
            if not user.is_authenticated:
                item.created_by = "🤫"
                item.created_by_user_id = None

            # Dump to dict with camelCase aliases
            item_data = item.model_dump(by_alias=True)
            # Remove DynamoDB internal fields from response
            item_data.pop('gsipk', None)
            
            transformed_items.append(item_data)

        body = {
            'items': transformed_items,
            'count': len(transformed_items),
            'dateRange': {
                'start': start_date,
                'end': end_date
            }
        }
        
        if user.is_authenticated:
            body['authenticated'] = True

        return create_response(200, body)

    except Exception as e:
        print(f"Error: {str(e)}")
        return create_response(500, {
            'error': 'Internal server error',
            'message': str(e)
        })
