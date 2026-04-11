import json
import boto3
from datetime import datetime
from typing import Any, Dict, List

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
    record_non_member_visit, handle_exception
)
from domain import GuestResultDto, APIResponse, GuestCheckInRequest, GuestCheckInResponseDto

dynamodb: DynamoDBServiceResource = boto3.resource("dynamodb")

def handler(event: APIGatewayProxyEventV2, context: Context) -> APIResponse:
    try:
        config = get_config()
        non_members_table = dynamodb.Table(config.non_members_table)

        staff_user = get_user_from_context(event)
        
        # Security: Always enforce staff/admin for recording guests 
        if "admin" not in staff_user.groups and "staff" not in staff_user.groups:
            return get_response(403, {"error": "Forbidden: Staff access required"})

        # Get check-in ID from path
        path_params = event.get("pathParameters") or {}
        checkin_id = path_params.get("id")
        if not checkin_id:
            return get_response(400, {"error": "Missing check-in ID in path"})

        body_str = event.get("body", "{}")
        try:
            request_data = GuestCheckInRequest.model_validate_json(body_str)
        except ValidationError as ve:
            return get_response(400, {"error": f"Invalid request body: {ve.errors()}"})

        timestamp = datetime.utcnow().isoformat()
        guest_results: List[GuestResultDto] = []
        
        for guest in request_data.guests:
            guest_name = guest.name.strip()
            guest_email = guest.email.strip().lower()
            if not guest_name or not guest_email:
                continue
                
            # Record visit and link to the check-in ID
            visit_count = record_non_member_visit(
                non_members_table, 
                guest_name, 
                guest_email, 
                staff_user.sub, 
                timestamp,
                checkin_id=checkin_id
            )
            
            guest_results.append(GuestResultDto(
                name=guest_name,
                email=guest_email,
                visit_count=visit_count,
            ))

        response_dto = GuestCheckInResponseDto(
            id=checkin_id,
            guests=guest_results
        )

        return get_response(200, response_dto.model_dump(by_alias=True))

    except Exception as e:
        return handle_exception(e)
