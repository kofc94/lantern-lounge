import os
import json
import boto3
import uuid
from datetime import datetime
import urllib.request
from shared import get_response, get_user_from_context

dynamodb = boto3.resource("dynamodb")
table_name = os.environ.get("CHECKINS_TABLE")
cognito_api_endpoint = os.environ.get("COGNITO_API_ENDPOINT")
table = dynamodb.Table(table_name)

def get_user_id_by_email(email):
    """Calls the internal Cognito API to look up user sub by email."""
    if not cognito_api_endpoint:
        print("COGNITO_API_ENDPOINT not configured")
        return None
        
    url = f"{cognito_api_endpoint}/validate-user?email={urllib.parse.quote(email)}"
    try:
        with urllib.request.urlopen(url) as response:
            if response.getcode() == 200:
                data = json.loads(response.read().decode())
                return data.get("sub")
            else:
                return None
    except Exception as e:
        print(f"Cognito API lookup error: {str(e)}")
        return None

def handler(event, context):
    staff_user = get_user_from_context(event)
    
    # Check if the user is an admin or staff
    groups = staff_user.get("groups", [])
    if "admin" not in groups and "staff" not in groups:
        return get_response(403, {"error": "Forbidden: Staff access required"})

    try:
        body = json.loads(event.get("body", "{}"))
        wallet_token = body.get("wallet_token")
        email = body.get("email")
        
        user_id = None
        
        if wallet_token:
            if not wallet_token.startswith("LL-"):
                return get_response(400, {"error": "Invalid wallet token"})
            user_id = wallet_token.replace("LL-", "")
        elif email:
            user_id = get_user_id_by_email(email)
            if not user_id:
                return get_response(404, {"error": "Member not found with that email address"})
        else:
            return get_response(400, {"error": "Missing wallet_token or email"})

        # Record the check-in
        check_in_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat()
        
        table.put_item(
            Item={
                "id": check_in_id,
                "timestamp": timestamp,
                "user_id": user_id,
                "staff_id": staff_user["sub"],
                "method": "manual" if email else "scan"
            }
        )
        
        return get_response(200, {
            "message": "Check-in successful",
            "user_id": user_id,
            "timestamp": timestamp,
            "method": "manual" if email else "scan"
        })
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return get_response(500, {"error": "Internal server error"})
