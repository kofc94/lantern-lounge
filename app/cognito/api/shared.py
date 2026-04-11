import json
from typing import Any, Dict, List, Optional, cast, TypedDict
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

class UserDto(CamelModel):
    username: str
    email: Optional[str] = None
    name: Optional[str] = None
    profile: str

class UsersResponseDto(CamelModel):
    users: List[UserDto]
    pagination_token: Optional[str] = None

class UpdateUserRoleRequest(CamelModel):
    profile: str

class APIResponse(TypedDict):
    statusCode: int
    headers: Dict[str, str]
    body: str

def get_user_info(event: APIGatewayProxyEventV2) -> UserContext:
    """Extract authentication status and user info from the API Gateway JWT authorizer context."""
    request_context = event.get('requestContext', {})
    authorizer = request_context.get('authorizer', {})

    # HTTP API v2 (JWT authorizer)
    jwt = authorizer.get('jwt', {})
    claims = jwt.get('claims') or authorizer.get('claims', {})

    if not claims:
        return UserContext(is_authenticated=False)

    groups_raw = claims.get('cognito:groups') or claims.get('groups') or []
    groups: List[str] = []
    if isinstance(groups_raw, list):
        groups = [str(g) for g in groups_raw]
    elif isinstance(groups_raw, str):
        groups = groups_raw.strip('[]').split()

    return UserContext(
        is_authenticated=True,
        is_admin='admin' in groups,
        email=claims.get('email'),
        user_id=claims.get('sub'),
    )

def create_response(status_code: int, body: Any) -> APIResponse:
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
