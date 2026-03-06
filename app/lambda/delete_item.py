import json
import os
import boto3
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['DYNAMODB_TABLE'])

def handler(event, context):
    """
    Delete a calendar item. Requires authentication.
    Users can only delete items they created.
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
    user_sub = claims.get('sub')  # Cognito user ID

    try:
        # Get item ID from path parameters
        path_params = event.get('pathParameters', {})
        item_id = path_params.get('id')

        if not item_id:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Bad request',
                    'message': 'Missing item ID'
                })
            }

        # First, get the existing item to verify ownership
        response = table.query(
            KeyConditionExpression=Key('id').eq(item_id)
        )

        if not response.get('Items'):
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Not found',
                    'message': 'Calendar item not found'
                })
            }

        existing_item = response['Items'][0]

        # Verify ownership
        if existing_item.get('createdByUserId') != user_sub:
            return {
                'statusCode': 403,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Forbidden',
                    'message': 'You can only delete items you created'
                })
            }

        # Delete the item
        table.delete_item(
            Key={
                'id': item_id,
                'timestamp': existing_item['timestamp']
            }
        )

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'DELETE,OPTIONS'
            },
            'body': json.dumps({
                'message': 'Calendar item deleted successfully',
                'itemId': item_id
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
