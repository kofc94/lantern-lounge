import json
import os
import boto3
import calendar
from datetime import datetime
from typing import Any, Dict, List, Optional
from boto3.dynamodb.conditions import Key
from shared import LambdaEvent, LambdaContext, LambdaResponse, get_user_info, create_response, UserContext, Visibility, Status, CalendarItem

dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get('DYNAMODB_TABLE', 'lantern-lounge-calendar-items')
table = dynamodb.Table(table_name)

def handler(event: LambdaEvent, context: LambdaContext) -> LambdaResponse:
    """
    Get calendar items. Returns all items in the specified date range.
    Transforms data based on authentication and visibility rules.
    """
    user: UserContext = get_user_info(event)
    
    try:
        # Query parameters for date filtering (optional)
        query_params: Dict[str, str] = event.get('queryStringParameters', {}) or {}
        
        # Default to first and last day of current month if not provided
        now = datetime.now()
        current_year = now.year
        current_month = now.month
        last_day = calendar.monthrange(current_year, current_month)[1]

        start_date: str = query_params.get('startDate') or f"{current_year}-{current_month:02d}-01"
        end_date: str = query_params.get('endDate') or f"{current_year}-{current_month:02d}-{last_day:02d}"

        # Query all items in the range using the refined ItemsByDate GSI
        # We must filter by the constant GSIPK ("EVENT") to query the range Sort Key (date)
        response = table.query(
            IndexName='ItemsByDate',
            KeyConditionExpression=Key('gsipk').eq('EVENT') & Key('date').between(start_date, end_date)
        )

        db_items: List[Dict[str, Any]] = response.get('Items', [])
        transformed_items: List[CalendarItem] = []

        for item_dict in db_items:
            item = CalendarItem.from_dict(item_dict)
            
            # Rule 1: Status Filtering
            # Admins see everything.
            # Non-admins only see APPROVED items OR items they created themselves.
  

            # Rule 2: Private Event Transformation
            # If PRIVATE and (unauthenticated OR not admin), hide details
            if item.visibility == Visibility.PRIVATE.value:
                if not user.is_admin:
                    item.title = "Date unavailable"
                    item.description = ""
                    item.location = ""
                    item.time = ""

            # Rule 3: Unauthenticated User Transformation
            # Hide creator information for anonymous users
            if not user.is_authenticated:
                item.createdBy = "🤫"
                item.createdByUserId = None

            transformed_items.append(item)
        
        return create_response(200, {
            'items': transformed_items,
            'count': len(transformed_items),
            'dateRange': {
                'start': start_date,
                'end': end_date
            }
        }, authenticated=user.is_authenticated)

    except Exception as e:
        print(f"Error: {str(e)}")
        return create_response(500, {
            'error': 'Internal server error',
            'message': str(e)
        })
