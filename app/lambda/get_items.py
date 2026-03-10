import json
import os
import boto3
from decimal import Decimal
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['DYNAMODB_TABLE'])

# Helper to convert DynamoDB Decimal to JSON-serializable types
def decimal_to_number(obj):
    if isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    raise TypeError

def handler(event, context):
    """
    Get calendar items. Returns public items for unauthenticated requests,
    and all items for authenticated requests.
    """
    print(f"Event: {json.dumps(event)}")

    # Check if user is authenticated via Cognito authorizer
    is_authenticated = False
    user_email = None

    if 'requestContext' in event and 'authorizer' in event['requestContext']:
        authorizer = event['requestContext']['authorizer']
        if 'jwt' in authorizer and 'claims' in authorizer['jwt']:
            claims = authorizer['jwt']['claims']
            is_authenticated = True
            user_email = claims.get('email', 'unknown')
            print(f"Authenticated user: {user_email}")

    try:
        # Query parameters for date filtering (optional)
        query_params = event.get('queryStringParameters', {}) or {}
        start_date = query_params.get('startDate')  # YYYY-MM-DD format
        end_date = query_params.get('endDate')      # YYYY-MM-DD format

        if is_authenticated:
            # Return all items (public + private) for authenticated users
            if start_date and end_date:
                # Query by date range using ItemsByDate GSI
                response = table.query(
                    IndexName='ItemsByDate',
                    KeyConditionExpression=Key('date').between(start_date, end_date)
                )
            elif start_date:
                # Query single date
                response = table.query(
                    IndexName='ItemsByDate',
                    KeyConditionExpression=Key('date').eq(start_date)
                )
            else:
                # Return all items
                response = table.scan()
        else:
            # Return only public items for unauthenticated users
            if start_date and end_date:
                # Query public items by date range
                response = table.query(
                    IndexName='PublicItemsByDate',
                    KeyConditionExpression=Key('isPublic').eq(1) & Key('date').between(start_date, end_date)
                )
            elif start_date:
                # Query public items for single date
                response = table.query(
                    IndexName='PublicItemsByDate',
                    KeyConditionExpression=Key('isPublic').eq(1) & Key('date').eq(start_date)
                )
            else:
                # Scan for all public items
                response = table.scan(
                    FilterExpression=Key('isPublic').eq(1)
                )

        items = response.get('Items', [])

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,OPTIONS'
            },
            'body': json.dumps({
                'items': items,
                'count': len(items),
                'authenticated': is_authenticated
            }, default=decimal_to_number)
        }

    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            })
        }
