import json
import boto3
import urllib.parse
import urllib.request
from decimal import Decimal

_ssm = boto3.client("ssm")
_config = None

def get_config():
    global _config
    if _config is None:
        response = _ssm.get_parameter(Name="/lantern-lounge/check-ins/config")
        _config = json.loads(response["Parameter"]["Value"])
    return _config

def get_response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        },
        "body": json.dumps(body, cls=DecimalEncoder)
    }

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return str(obj)
        return super(DecimalEncoder, self).default(obj)

def get_member_from_zeffy(zeffy_token):
    """Calls the Zeffy tRPC API and returns the member data dict, or None on failure.
    Expected keys: buyerEmail, firstName, lastName (logged on first call for verification)."""
    input_param = '%7B%22token%22%3A%22' + urllib.parse.quote(zeffy_token) + '%22%7D'
    url = f"https://api.zeffy.com/_new/trpc/getMembershipCardMemberInfo?input={input_param}"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "LanternLounge/1.0"})
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode())
            member = data.get("result", {}).get("data", {})
            print(f"Zeffy member keys: {list(member.keys())}")
            return member
    except Exception as e:
        print(f"Zeffy API error: {str(e)}")
        return None


def get_user_info_by_email(email, cognito_api_endpoint):
    """Calls the internal Cognito API to look up user info by email. Returns dict with sub and name, or None."""
    url = f"{cognito_api_endpoint}/validate-user?email={urllib.parse.quote(email)}"
    try:
        with urllib.request.urlopen(url) as response:
            if response.getcode() == 200:
                return json.loads(response.read().decode())
            return None
    except Exception as e:
        print(f"Cognito API lookup error: {str(e)}")
        return None


def record_non_member_visit(table, name, email, staff_id, timestamp):
    """Upserts a non-member visit record and returns the updated visit count."""
    response = table.update_item(
        Key={"email": email},
        UpdateExpression=(
            "SET #n = :name, last_visit = :ts, staff_id = :sid "
            "ADD visit_count :inc"
        ),
        ExpressionAttributeNames={"#n": "name"},
        ExpressionAttributeValues={
            ":name": name,
            ":ts": timestamp,
            ":sid": staff_id,
            ":inc": 1,
        },
        ConditionExpression="attribute_exists(email) OR attribute_not_exists(email)",
        ReturnValues="ALL_NEW",
    )
    return int(response["Attributes"].get("visit_count", 1))


def get_user_from_context(event):
    """Extracts user information from API Gateway JWT authorizer context."""
    authorizer = event.get("requestContext", {}).get("authorizer", {})
    jwt = authorizer.get("jwt", {})
    claims = jwt.get("claims", {})
    
    return {
        "sub": claims.get("sub"),
        "email": claims.get("email"),
        "name": claims.get("name"),
        "groups": claims.get("cognito:groups", [])
    }
