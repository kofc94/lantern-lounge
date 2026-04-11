import json
import os
from decimal import Decimal
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Type, TypeVar, TypedDict
from typing_extensions import NotRequired
from enum import Enum
from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

# Type aliases for AWS Lambda
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from aws_lambda_typing.events import APIGatewayProxyEventV2
    from aws_lambda_typing.context import Context
else:
    APIGatewayProxyEventV2 = object
    Context = object

class Visibility(str, Enum):
    PUBLIC = "PUBLIC"
    PRIVATE = "PRIVATE"

class Status(str, Enum):
    PENDING_APPROVAL = "PENDING_APPROVAL"
    APPROVED = "APPROVED"

class CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )

class UserContext(CamelModel):
    is_authenticated: bool
    is_admin: bool = False
    email: Optional[str] = None
    user_id: Optional[str] = None

class CalendarItem(CamelModel):
    id: str
    date: str               # YYYY-MM-DD
    title: str
    gsipk: str = "EVENT"   # Static GSI partition key
    description: str = ""
    visibility: Visibility = Visibility.PUBLIC
    status: Status = Status.PENDING_APPROVAL
    created_by: str = "unknown"
    created_by_user_id: Optional[str] = None
    created_at: Optional[str] = None  # ISO 8601
    updated_at: Optional[str] = None  # ISO 8601

    def to_dynamo(self) -> Dict[str, Any]:
        """Serialize for DynamoDB storage."""
        return self.model_dump(exclude_none=True, by_alias=False)

class CreateItemRequest(CamelModel):
    title: str
    date: str
    description: str = ""
    visibility: Optional[Visibility] = None

class UpdateItemRequest(CamelModel):
    title: Optional[str] = None
    date: Optional[str] = None
    description: Optional[str] = None
    visibility: Optional[Visibility] = None
    status: Optional[Status] = None

class APIResponse(TypedDict):
    statusCode: int
    headers: Dict[str, str]
    body: str
    isBase64Encoded: NotRequired[bool]

def now_iso() -> str:
    """Current UTC time as an ISO 8601 string."""
    return datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj: Any) -> Any:
        if isinstance(obj, Decimal):
            return int(obj) if obj % 1 == 0 else float(obj)
        return super(DecimalEncoder, self).default(obj)

def get_user_info(event: APIGatewayProxyEventV2) -> UserContext:
    """Extract authentication status and user info from event."""
    request_context = event.get('requestContext', {})
    authorizer = request_context.get('authorizer', {})
    
    # Try HTTP API v2 (JWT)
    jwt = authorizer.get('jwt', {})
    claims = jwt.get('claims')
    
    # Try REST API or alternative mappings
    if not claims:
        claims = authorizer.get('claims', {})

    if claims:
        groups_raw = claims.get('cognito:groups') or claims.get('groups') or []
        groups: List[str] = []
        
        if isinstance(groups_raw, list):
            groups = [str(g) for g in groups_raw]
        elif isinstance(groups_raw, str):
            groups = groups_raw.strip('[]').split()
        
        return UserContext(
            is_authenticated=True,
            is_admin="admin" in groups,
            email=claims.get('email', 'unknown'),
            user_id=claims.get('sub')
        )

    return UserContext(is_authenticated=False)

def create_response(status_code: int, body: Any) -> APIResponse:
    """Create a standard API Gateway response."""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        'body': json.dumps(body, cls=DecimalEncoder)
    }
