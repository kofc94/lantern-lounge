import json
import boto3
import uuid
from datetime import datetime, date
from shared import (
    get_response, get_user_from_context, get_config,
    get_member_from_zeffy, get_user_info_by_email, record_non_member_visit,
)

dynamodb = boto3.resource("dynamodb")

NON_MEMBER_VISIT_THRESHOLD = 3


def compute_expiry(buy_date_raw):
    """Parse buyDate from Zeffy and return expiry date (buyDate + 1 year) as a date object, or None."""
    if not buy_date_raw:
        return None
    try:
        if isinstance(buy_date_raw, (int, float)):
            dt = datetime.utcfromtimestamp(buy_date_raw / 1000)
        else:
            for fmt in ("%Y-%m-%dT%H:%M:%S.%fZ", "%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d"):
                try:
                    dt = datetime.strptime(str(buy_date_raw), fmt)
                    break
                except ValueError:
                    continue
            else:
                print(f"Could not parse buyDate: {buy_date_raw!r}")
                return None
        try:
            return dt.replace(year=dt.year + 1).date()
        except ValueError:
            return dt.replace(year=dt.year + 1, day=28).date()
    except Exception as e:
        print(f"Error computing expiry: {e}")
        return None


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
        zeffy_token = body.get("zeffy_token")
        guests = body.get("guests", [])

        if not zeffy_token:
            return get_response(400, {"error": "Missing zeffy_token"})

        zeffy_member = get_member_from_zeffy(zeffy_token)
        if not zeffy_member:
            return get_response(404, {"error": "Membership card not found or expired"})

        email = zeffy_member.get("buyerEmail")
        if not email:
            return get_response(404, {"error": "No email associated with this membership card"})

        expiry = compute_expiry(zeffy_member.get("buyDate"))
        expiry_iso = expiry.isoformat() if expiry else None
        today = date.today()

        if expiry and expiry < today:
            return get_response(403, {
                "error": "Membership expired",
                "code": "membership_expired",
                "expiry_date": expiry_iso,
            })

        user_info = get_user_info_by_email(email, cognito_api_endpoint)
        if not user_info:
            return get_response(404, {
                "error": "Member not registered",
                "code": "not_registered",
                "expiry_date": expiry_iso,
                "zeffy_member": {
                    "email": email,
                    "first_name": zeffy_member.get("buyerFirstName", ""),
                    "last_name": zeffy_member.get("buyerLastName", ""),
                },
            })

        user_id = user_info.get("sub")
        user_name = user_info.get("name")
        timestamp = datetime.utcnow().isoformat()

        table.put_item(Item={
            "id": str(uuid.uuid4()),
            "timestamp": timestamp,
            "user_id": user_id,
            "staff_id": staff_user["sub"],
            "method": "scan",
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
            "expiry_date": expiry_iso,
            "timestamp": timestamp,
            "method": "scan",
            "guests": guest_results,
        })

    except Exception as e:
        print(f"Error: {str(e)}")
        return get_response(500, {"error": "Internal server error"})
