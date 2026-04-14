import json
import os
from decimal import Decimal
from datetime import datetime, timezone, date
from typing import Any, Dict, List, Optional, Type, TypeVar, TypedDict
from typing_extensions import NotRequired
from enum import Enum
from pydantic import BaseModel, ConfigDict, Field, field_validator
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
    name: Optional[str] = None
    user_id: Optional[str] = None

class CalendarItem(CamelModel):
    id: str
    date: date
    title: str
    gsipk: str = "EVENT"   # Static GSI partition key
    description: str = ""
    visibility: Visibility = Visibility.PUBLIC
    status: Status = Status.PENDING_APPROVAL
    created_by: str = "unknown"
    created_by_user_id: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    @field_validator('created_at', 'updated_at', mode='before')
    @classmethod
    def convert_timestamp(cls, v: Any) -> Optional[datetime]:
        if isinstance(v, (int, float, Decimal)):
            # Convert epoch (seconds or ms) to datetime
            ts = float(v)
            if ts > 1e12:  # Likely milliseconds
                ts /= 1000
            return datetime.fromtimestamp(ts, tz=timezone.utc)
        return v

    def to_dynamo(self) -> Dict[str, Any]:
        """Serialize for DynamoDB storage."""
        # mode='json' automatically converts datetime/date to ISO 8601 strings
        return self.model_dump(exclude_none=True, by_alias=False, mode='json')

class CreateItemRequest(CamelModel):
    title: str
    date: date
    description: str = ""
    visibility: Optional[Visibility] = None

class UpdateItemRequest(CamelModel):
    title: Optional[str] = None
    date: Optional[date] = None
    description: Optional[str] = None
    visibility: Optional[Visibility] = None
    status: Optional[Status] = None

class APIResponse(TypedDict):
    statusCode: int
    headers: Dict[str, str]
    body: str
    isBase64Encoded: NotRequired[bool]

def now_utc() -> datetime:
    """Current UTC time as a datetime object."""
    return datetime.now(timezone.utc)

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj: Any) -> Any:
        if isinstance(obj, Decimal):
            return int(obj) if obj % 1 == 0 else float(obj)
        if isinstance(obj, (datetime, date)):
            return obj.isoformat().replace('+00:00', 'Z')
        return super(DecimalEncoder, self).default(obj)

def get_user_info(event: APIGatewayProxyEventV2) -> UserContext:
    """Extract authentication status and user info from event."""
    request_context = event.get('requestContext', {})
    authorizer = request_context.get('authorizer', {})
    
    # 1. Try HTTP API v2 (JWT Authorizer context)
    jwt_context = authorizer.get('jwt', {})
    claims = jwt_context.get('claims')
    
    # 2. Try alternative context mappings (e.g. if using a custom lambda authorizer)
    if not claims:
        claims = authorizer.get('claims')

    # 3. Fallback: Manual JWT parsing from Authorization header
    # This is necessary for routes with authorization_type = "NONE" (optional auth)
    if not claims:
        headers = event.get('headers', {})
        auth_header = headers.get('authorization') or headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            try:
                import jwt as pyjwt
                # We decode WITHOUT verification here because API Gateway has already validated
                # the token if it was mandatory, or we are on a public route where we just
                # want to know "who" the user is if they provided a token.
                # In a high-security environment, we would verify the signature here too.
                claims = pyjwt.decode(token, options={"verify_signature": False})
            except Exception as e:
                print(f"Manual JWT decode failed: {e}")

    if claims:
        groups_raw = claims.get('cognito:groups') or claims.get('groups') or []
        groups: List[str] = []
        
        if isinstance(groups_raw, list):
            groups = [str(g) for g in groups_raw]
        elif isinstance(groups_raw, str):
            # Robustly handle string representation of list "[group1 group2]"
            groups = groups_raw.strip('[]').split()
        
        return UserContext(
            is_authenticated=True,
            is_admin="admin" in groups,
            email=claims.get('email', 'unknown'),
            name=claims.get('name'),
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
