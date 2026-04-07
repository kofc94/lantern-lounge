import json
import os
import boto3

cognito = boto3.client("cognito-idp")
user_pool_id = os.environ.get("USER_POOL_ID")

def get_response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        },
        "body": json.dumps(body)
    }

def handler(event, context):
    query_params = event.get("queryStringParameters", {})
    email = query_params.get("email")
    
    if not email:
        return get_response(400, {"error": "Missing email parameter"})

    try:
        response = cognito.list_users(
            UserPoolId=user_pool_id,
            Filter=f'email = "{email}"',
            Limit=1
        )
        users = response.get("Users", [])
        
        if not users:
            return get_response(404, {"exists": False, "error": "User not found"})
        
        user = users[0]
        return get_response(200, {
            "exists": True,
            "sub": user.get("Username"),
            "status": user.get("UserStatus")
        })
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return get_response(500, {"error": "Internal server error"})
