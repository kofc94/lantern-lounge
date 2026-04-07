import json
import boto3
import uuid
from datetime import datetime
from shared import (
    get_response, get_user_from_context, get_config,
    get_user_info_by_email, record_non_member_visit,
)

dynamodb = boto3.resource("dynamodb")

NON_MEMBER_VISIT_THRESHOLD = 3


def handler(event, context):
    config = get_config()
    table = dynamodb.Table(config["checkins_table"])
    non_members_table = dynamodb.Table(config["non_members_table"])
    cognito_api_endpoint = config["cognito_api_endpoint"]

    staff_user = get_user_from_context(event)
    if "admin" not in staff_user.get("groups", []) and "staff" not in staff_user.get("groups", []):
        return get_response(403, {"error": "Forbidden: Staff access required"})

    try:
        body = json.loads(event.get("body", "{}"))
        email = body.get("email")
        guests = body.get("guests", [])

        if not email:
            return get_response(400, {"error": "Missing email"})

        user_info = get_user_info_by_email(email, cognito_api_endpoint)
        if not user_info:
            return get_response(404, {"error": "Member not found with that email address"})

        user_id = user_info.get("sub")
        user_name = user_info.get("name")
        timestamp = datetime.utcnow().isoformat()

        table.put_item(Item={
            "id": str(uuid.uuid4()),
            "timestamp": timestamp,
            "user_id": user_id,
            "staff_id": staff_user["sub"],
            "method": "manual",
        })

        guest_results = []
        for guest in guests:
            guest_name = (guest.get("name") or "").strip()
            guest_email = (guest.get("email") or "").strip().lower()
            if not guest_name or not guest_email:
                continue
            visit_count = record_non_member_visit(non_members_table, guest_name, guest_email, staff_user["sub"], timestamp)
            guest_results.append({
                "name": guest_name,
                "email": guest_email,
                "visit_count": visit_count,
                "should_become_member": visit_count > NON_MEMBER_VISIT_THRESHOLD,
            })

        return get_response(200, {
            "message": "Check-in successful",
            "user_id": user_id,
            "user_name": user_name,
            "timestamp": timestamp,
            "method": "manual",
            "guests": guest_results,
        })

    except Exception as e:
        print(f"Error: {str(e)}")
        return get_response(500, {"error": "Internal server error"})
