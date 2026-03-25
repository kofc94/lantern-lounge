import json
import dataclasses
from decimal import Decimal
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, cast, TypedDict, Type, TypeVar
from dataclasses import dataclass, asdict
from enum import Enum

# Type aliases for AWS Lambda
LambdaEvent = Dict[str, Any]
LambdaContext = Any

T = TypeVar('T', bound='CalendarItem')


class Visibility(str, Enum):
    PUBLIC = "PUBLIC"
    PRIVATE = "PRIVATE"


class Status(str, Enum):
    PENDING_APPROVAL = "PENDING_APPROVAL"
    APPROVED = "APPROVED"


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
    """Internal domain object — matches DynamoDB storage shape, including GSI keys."""
    id: str
    date: str               # YYYY-MM-DD
    title: str
    gsipk: str = "EVENT"   # Static GSI partition key — internal, never exposed in responses
    description: str = ""
    visibility: str = Visibility.PUBLIC.value
    status: str = Status.PENDING_APPROVAL.value
    createdBy: str = "unknown"
    createdByUserId: Optional[str] = None
    createdAt: Optional[str] = None  # ISO 8601
    updatedAt: Optional[str] = None  # ISO 8601

    def to_dict(self) -> Dict[str, Any]:
        """Serialize for DynamoDB storage (includes gsipk)."""
        return {k: v for k, v in asdict(self).items() if v is not None}

    def to_response(self) -> 'EventResponse':
        """Return the public-facing DTO, stripping DynamoDB internals."""
        return EventResponse(
            id=self.id,
            date=self.date,
            title=self.title,
            description=self.description,
            visibility=self.visibility,
            status=self.status,
            createdBy=self.createdBy,
            createdByUserId=self.createdByUserId,
            createdAt=self.createdAt,
            updatedAt=self.updatedAt,
        )

    @classmethod
    def from_dict(cls: Type[T], data: Dict[str, Any]) -> T:
        """Hydrate from a DynamoDB item dict."""
        valid_fields = {f.name for f in dataclasses.fields(cls)}
        return cls(**{k: v for k, v in data.items() if k in valid_fields})


@dataclass
class EventResponse:
    """Public API response shape — no DynamoDB internals."""
    id: str
    date: str
    title: str
    description: str = ""
    visibility: str = Visibility.PUBLIC.value
    status: str = Status.PENDING_APPROVAL.value
    createdBy: str = "unknown"
    createdByUserId: Optional[str] = None
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {k: v for k, v in asdict(self).items() if v is not None}


def now_iso() -> str:
    """Current UTC time as an ISO 8601 string (e.g. 2026-03-24T15:30:00Z)."""
    return datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')


def json_serial(obj: Any) -> Any:
    """JSON serializer for types not handled by the default encoder."""
    if isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    if dataclasses.is_dataclass(obj) and not isinstance(obj, type):
        return {k: v for k, v in dataclasses.asdict(obj).items() if v is not None}
    if isinstance(obj, Enum):
        return obj.value
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")


def get_user_info(event: LambdaEvent) -> UserContext:
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
        # Extract groups - handle both list and delimited string formats.
        # API Gateway serializes JWT array claims differently depending on version/config.
        # Comma-separated is common for REST APIs, Space-separated for some HTTP API setups.
        groups_raw = claims.get('cognito:groups')
        groups: List[str] = []
        
        if isinstance(groups_raw, list):
            groups = [str(g) for g in groups_raw]
        elif isinstance(groups_raw, str):
            # Replace common delimiters with space and split
            groups = groups_raw.strip('[]').split()
        
        return UserContext(
            is_authenticated=True,
            is_admin="admin" in groups,
            email=cast(Optional[str], claims.get('email', 'unknown')),
            user_id=cast(Optional[str], claims.get('sub'))
        )

    return UserContext(is_authenticated=False)


def create_response(status_code: int, body: Any, authenticated: Optional[bool] = None) -> LambdaResponse:
    """Create a standard API Gateway response."""
    if authenticated is not None and isinstance(body, dict):
        body['authenticated'] = authenticated

    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        'body': json.dumps(body, default=json_serial)
    }
