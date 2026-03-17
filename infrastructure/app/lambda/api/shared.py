import json
import os
from decimal import Decimal
from typing import Any, Dict, List, Optional, Union, cast, TypedDict, Type, TypeVar
from dataclasses import dataclass, asdict, field
from enum import Enum

# Type aliases for AWS Lambda
LambdaEvent = Dict[str, Any]
LambdaContext = Any

T = TypeVar('T', bound='CalendarItem')

class Visibility(str, Enum):
    PUBLIC = "PUBLIC"
    PRIVATE = "PRIVATE"

class LambdaResponse(TypedDict):
    """Structured API Gateway response."""
    statusCode: int
    headers: Dict[str, str]
    body: str

@dataclass
class UserContext:
    """Authentication context for the current user."""
    is_authenticated: bool
    is_admin: bool = False
    email: Optional[str] = None
    user_id: Optional[str] = None

@dataclass
class CalendarItem:
    """Represents a Lantern Lounge calendar event."""
    id: str
    timestamp: int
    title: str
    date: str  # YYYY-MM-DD
    description: str = ""
    time: str = "" # HH:MM (optional)
    location: str = ""
    visibility: str = Visibility.PUBLIC.value
    createdBy: str = "unknown"
    createdByUserId: Optional[str] = None
    createdAt: Optional[int] = None
    updatedAt: Optional[int] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to a DynamoDB-friendly dictionary."""
        return {k: v for k, v in asdict(self).items() if v is not None}

    @classmethod
    def from_dict(cls: Type[T], data: Dict[str, Any]) -> T:
        """Create a CalendarItem from a dictionary (e.g. from DynamoDB)."""
        # Extract only the fields that exist in the dataclass
        from dataclasses import fields
        valid_fields = {f.name for f in fields(cls)}
        filtered_data = {k: v for k, v in data.items() if k in valid_fields}
        return cls(**filtered_data)

def decimal_to_number(obj: Any) -> Union[int, float]:
    """Helper to convert DynamoDB Decimal to JSON-serializable types."""
    if isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")

def get_user_info(event: LambdaEvent) -> UserContext:
    """Extract authentication status and user info from event."""
    request_context = event.get('requestContext', {})
    authorizer = request_context.get('authorizer', {})
    jwt = authorizer.get('jwt', {})
    claims = jwt.get('claims', {})

    if claims:
        groups = claims.get('cognito:groups', [])
        if isinstance(groups, str):
            groups = [groups]
        
        is_admin = "admin" in groups

        return UserContext(
            is_authenticated=True,
            is_admin=is_admin,
            email=cast(Optional[str], claims.get('email', 'unknown')),
            user_id=cast(Optional[str], claims.get('sub'))
        )
    
    return UserContext(is_authenticated=False)

def create_response(status_code: int, body: Any, authenticated: Optional[bool] = None) -> LambdaResponse:
    """Create a standard API Gateway response."""
    # Convert objects to dicts if necessary
    processed_body = body
    if isinstance(body, CalendarItem):
        processed_body = body.to_dict()
    elif isinstance(body, list):
        processed_body = [item.to_dict() if isinstance(item, CalendarItem) else item for item in body]
    elif isinstance(body, dict):
        processed_body = {k: (v.to_dict() if isinstance(v, CalendarItem) else v) for k, v in body.items()}
        if authenticated is not None:
            processed_body['authenticated'] = authenticated

    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        'body': json.dumps(processed_body, default=decimal_to_number)
    }
