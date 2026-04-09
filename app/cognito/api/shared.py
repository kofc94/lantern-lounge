import json
import dataclasses
from typing import Any, Dict, List, Optional, cast, TypedDict
from dataclasses import dataclass

# Type aliases for AWS Lambda
LambdaEvent = Dict[str, Any]
LambdaContext = Any
LambdaResponse = TypedDict('LambdaResponse', {'statusCode': int, 'headers': Dict[str, str], 'body': str})


@dataclass
class UserContext:
    """Authentication context for the current user."""
    is_authenticated: bool
    is_admin: bool = False
    email: Optional[str] = None
    user_id: Optional[str] = None


def get_user_info(event: LambdaEvent) -> UserContext:
    """Extract authentication status and user info from the API Gateway JWT authorizer context."""
    request_context = event.get('requestContext', {})
    authorizer = request_context.get('authorizer', {})

    # HTTP API v2 (JWT authorizer)
    jwt = authorizer.get('jwt', {})
    claims = jwt.get('claims') or authorizer.get('claims', {})

    if not claims:
        return UserContext(is_authenticated=False)

    groups_raw = claims.get('cognito:groups')
    groups: List[str] = []
    if isinstance(groups_raw, list):
        groups = [str(g) for g in groups_raw]
    elif isinstance(groups_raw, str):
        groups = groups_raw.strip('[]').split()

    return UserContext(
        is_authenticated=True,
        is_admin='admin' in groups,
        email=cast(Optional[str], claims.get('email')),
        user_id=cast(Optional[str], claims.get('sub')),
    )


def create_response(status_code: int, body: Any) -> LambdaResponse:
    """Create a standard API Gateway response."""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            'Access-Control-Allow-Methods': 'GET,PATCH,OPTIONS',
        },
        'body': json.dumps(body),
    }
