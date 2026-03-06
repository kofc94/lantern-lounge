import json
import os
import boto3
import uuid
from datetime import datetime
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['DYNAMODB_TABLE'])

def handler(event, context):
    """
    Create a new calendar item. Requires authentication.
    """
    print(f"Event: {json.dumps(event)}")

    # Verify user is authenticated
    if 'requestContext' not in event or 'authorizer' not in event['requestContext']:
        return {
            'statusCode': 401,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Unauthorized'})
        }

    authorizer = event['requestContext']['authorizer']
    if 'jwt' not in authorizer or 'claims' not in authorizer['jwt']:
        return {
            'statusCode': 401,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Unauthorized'})
        }

    claims = authorizer['jwt']['claims']
    user_email = claims.get('email', 'unknown')
    user_sub = claims.get('sub')  # Cognito user ID

    try:
        # Parse request body
        body = json.loads(event.get('body', '{}'))

        # Validate required fields
        required_fields = ['title', 'date']
        for field in required_fields:
            if field not in body:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'error': 'Bad request',
                        'message': f'Missing required field: {field}'
                    })
                }

        # Generate unique ID and timestamp
        item_id = str(uuid.uuid4())
        timestamp = int(datetime.now().timestamp() * 1000)  # Milliseconds

        # Create item
        item = {
            'id': item_id,
            'timestamp': timestamp,
            'title': body['title'],
            'description': body.get('description', ''),
            'date': body['date'],  # YYYY-MM-DD format
            'time': body.get('time', ''),  # HH:MM format (optional)
            'location': body.get('location', ''),
            'isPublic': 1 if body.get('isPublic', False) else 0,
            'createdBy': user_email,
            'createdByUserId': user_sub,
            'createdAt': timestamp,
            'updatedAt': timestamp
        }

        # Save to DynamoDB
        table.put_item(Item=item)

        return {
            'statusCode': 201,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'POST,OPTIONS'
            },
            'body': json.dumps({
                'message': 'Calendar item created successfully',
                'item': item
            })
        }

    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Bad request',
                'message': 'Invalid JSON in request body'
            })
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
