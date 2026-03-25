import json
import os
import dataclasses
from decimal import Decimal
from typing import Any, Dict, List, Optional, cast, TypedDict
from dataclasses import dataclass

# Type aliases for AWS Lambda
LambdaEvent = Dict[str, Any]
LambdaContext = Any

@dataclass
class UserContext:
    """Authentication context for the current user."""
    is_authenticated: bool
    role: str = "limited"
    is_admin: bool = False
    is_limited: bool = True
    email: Optional[str] = None
    user_id: Optional[str] = None

class LambdaResponse(TypedDict):
    statusCode: int
    headers: Dict[str, str]
    body: str

def json_serial(obj: Any) -> Any:
    """JSON serializer for types not handled by the default encoder."""
    if isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    if dataclasses.is_dataclass(obj) and not isinstance(obj, type):
        return {k: v for k, v in dataclasses.asdict(obj).items() if v is not None}
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
        # derive role from 'profile' attribute
        # In Cognito, custom/standard attributes in ID Token are just top-level claims
        role = claims.get('profile', 'limited')
        
        return UserContext(
            is_authenticated=True,
            role=role,
            is_admin=role == "admin",
            is_limited=role == "limited",
            email=cast(Optional[str], claims.get('email', 'unknown')),
            user_id=cast(Optional[str], claims.get('sub'))
        )

    return UserContext(is_authenticated=False)

def create_response(status_code: int, body: Any) -> LambdaResponse:
    """Create a standard API Gateway response."""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,PATCH,OPTIONS'
        },
        'body': json.dumps(body, default=json_serial)
    }
