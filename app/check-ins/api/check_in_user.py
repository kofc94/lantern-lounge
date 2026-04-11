import json
import boto3
from ulid import ULID
from datetime import datetime
from typing import Any, Dict, List, Optional

from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from mypy_boto3_dynamodb.service_resource import DynamoDBServiceResource
    from aws_lambda_typing.events import APIGatewayProxyEventV2
    from aws_lambda_typing.context import Context
else:
    DynamoDBServiceResource = object
    APIGatewayProxyEventV2 = object
    Context = object

from pydantic import ValidationError
from shared import (
    get_response, get_user_from_context, get_config,
    get_user_info_by_email, record_non_member_visit,
    handle_exception, now_utc
)
from domain import GuestResultDto, APIResponse, ManualCheckInRequest, CheckInResponseDto

dynamodb: DynamoDBServiceResource = boto3.resource("dynamodb")

def handler(event: APIGatewayProxyEventV2, context: Context) -> APIResponse:
    try:
        config = get_config()
        table = dynamodb.Table(config.checkins_table)
        cognito_api_endpoint = config.cognito_api_endpoint

        staff_user = get_user_from_context(event)
        
        body_str = event.get("body", "{}")
        try:
            request_data = ManualCheckInRequest.model_validate_json(body_str)
        except ValidationError as ve:
            return get_response(400, {"error": f"Invalid request body: {ve.errors()}"})

        target_email = request_data.email
        
        if target_email:
            # Explicit email provided: Staff checking in a member
            if "admin" not in staff_user.groups and "staff" not in staff_user.groups:
                return get_response(403, {"error": "Forbidden: Staff access required to check in others"})
            
            user_info = get_user_info_by_email(target_email, cognito_api_endpoint)
            if not user_info:
                return get_response(404, {"error": "Member not found with that email address"})
            
            user_id = user_info.sub
            user_name = user_info.name
        else:
            # No email provided: User checking in themselves
            user_id = staff_user.sub
            user_name = staff_user.name or staff_user.email or "Member"

        now = now_utc()
        checkin_id = str(ULID())

        table.put_item(Item={
            "id": checkin_id,
            "created_at": now.strftime('%Y-%m-%dT%H:%M:%SZ'),
            "user_id": user_id,
            "staff_id": staff_user.sub,
            "method": "manual",
        })

        response_dto = CheckInResponseDto(
            id=checkin_id,
            user_id=user_id,
            user_name=user_name or "Unknown",
            created_at=now,
        )

        return get_response(200, response_dto.model_dump(exclude_none=True, by_alias=True))

    except Exception as e:
        return handle_exception(e)
