import json
import boto3
import urllib.parse
import urllib.request
import os
from decimal import Decimal
from typing import Any, Dict, Optional, cast

from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from mypy_boto3_ssm import SSMClient
    from mypy_boto3_dynamodb.service_resource import Table
    from aws_lambda_typing.events import APIGatewayProxyEventV2
    from aws_lambda_typing.context import Context
else:
    SSMClient = object
    Table = object
    APIGatewayProxyEventV2 = object
    Context = object

from domain import AppConfig, UserContext, CognitoUser, APIResponse

_ssm: SSMClient = boto3.client("ssm")
_config: Optional[AppConfig] = None

def get_config() -> AppConfig:
    global _config
    if _config is None:
        response = _ssm.get_parameter(Name="/lantern-lounge/check-ins/config")
        val = response.get("Parameter", {}).get("Value")
        if not val:
            raise ValueError("Config parameter is empty")
        parsed = json.loads(val)
        _config = AppConfig(
            checkins_table=parsed["checkins_table"],
            non_members_table=parsed["non_members_table"],
            cognito_api_endpoint=parsed["cognito_api_endpoint"],
        )
    return _config

import logging
import traceback

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def get_response(status_code: int, body: Dict[str, Any]) -> APIResponse:
    if status_code >= 400:
        logger.error(f"Error Response {status_code}: {body}")
        
    return APIResponse(
        statusCode=status_code,
        headers={
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        },
        body=json.dumps(body, cls=DecimalEncoder)
    )

def handle_exception(e: Exception) -> APIResponse:
    """Centralized exception handler for 500 errors with detailed logging."""
    error_type = type(e).__name__
    error_msg = str(e)
    stack_trace = traceback.format_exc()
    
    logger.error(f"Unhandled exception: {error_type}: {error_msg}\n{stack_trace}")
    
    return get_response(500, {
        "error": "Internal server error",
        "details": f"{error_type}: {error_msg}",
        "trace": stack_trace if os.environ.get("DEBUG") == "true" else None
    })

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj: Any) -> Any:
        if isinstance(obj, Decimal):
            return str(obj)
        return super(DecimalEncoder, self).default(obj)

def get_user_info_by_email(email: str, cognito_api_endpoint: str) -> Optional[CognitoUser]:
    """Calls the internal Cognito API to look up user info by email."""
    url = f"{cognito_api_endpoint}/validate-user?email={urllib.parse.quote(email)}"
    try:
        with urllib.request.urlopen(url) as response:
            if response.getcode() == 200:
                data = json.loads(response.read().decode())
                return CognitoUser(
                    sub=data.get("sub", ""),
                    name=data.get("name", "")
                )
            return None
    except Exception as e:
        print(f"Cognito API lookup error: {str(e)}")
        return None

def record_non_member_visit(table: Table, name: str, email: str, staff_id: str, timestamp: str, checkin_id: Optional[str] = None) -> int:
    """Upserts a non-member visit record and returns the updated visit count."""
    update_expr = (
        "SET #n = :name, last_visit = :ts, staff_id = :sid "
        "ADD visit_count :inc"
    )
    attr_values: Dict[str, Any] = {
        ":name": name,
        ":ts": timestamp,
        ":sid": staff_id,
        ":inc": 1,
    }
    
    if checkin_id:
        update_expr = update_expr.replace("SET ", "SET last_checkin_id = :cid, ")
        attr_values[":cid"] = checkin_id

    response = table.update_item(
        Key={"email": email},
        UpdateExpression=update_expr,
        ExpressionAttributeNames={"#n": "name"},
        ExpressionAttributeValues=attr_values,
        ConditionExpression="attribute_exists(email) OR attribute_not_exists(email)",
        ReturnValues="ALL_NEW",
    )
    attributes = response.get("Attributes", {})
    return int(str(attributes.get("visit_count", 1)))

def get_user_from_context(event: APIGatewayProxyEventV2) -> UserContext:
    """Extracts user information from API Gateway JWT authorizer context."""
    request_context: Any = event.get("requestContext", {})
    authorizer: Any = request_context.get("authorizer", {}) if request_context else {}
    
    logger.info(f"Full Authorizer Context: {json.dumps(authorizer)}")
    
    jwt_context: Any = authorizer.get("jwt", {}) if authorizer else {}
    claims: Any = jwt_context.get("claims", {}) if jwt_context else {}
    
    logger.info(f"Extracted JWT Claims: {json.dumps(claims)}")
    
    # cognito:groups might be:
    # 1. A list: ["admin", "staff"]
    # 2. A single string: "admin"
    # 3. A string representation of a list: "[admin staff]"
    groups_raw: Any = claims.get("cognito:groups") or claims.get("groups") or []
    groups: List[str] = []
    
    if isinstance(groups_raw, list):
        groups = [str(g) for g in groups_raw]
    elif isinstance(groups_raw, str):
        if groups_raw.startswith("[") and groups_raw.endswith("]"):
            # Handle "[group1 group2]" format
            groups = groups_raw[1:-1].split()
        else:
            groups = [groups_raw]
    
    user_context = UserContext(
        sub=claims.get("sub", ""),
        email=claims.get("email"),
        name=claims.get("name"),
        groups=groups
    )
    
    logger.info(f"Final User Context: {user_context}")
    return user_context
