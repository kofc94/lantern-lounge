import json
import os
import boto3
from typing import Any, Dict, List, Set
from pydantic import ValidationError
from shared import (
    APIGatewayProxyEventV2, Context, APIResponse, 
    get_user_info, create_response,
    UserDto, UsersResponseDto, UpdateUserRoleRequest
)

cognito = boto3.client('cognito-idp')
USER_POOL_ID = os.environ.get('USER_POOL_ID')


def handler(event: APIGatewayProxyEventV2, context: Context) -> APIResponse:
    """
    GET  /users               – List users with their roles (admin only)
    PATCH /users/{username}   – Update a user's role (admin only)
    """
    user = get_user_info(event)

    if not user.is_authenticated or not user.is_admin:
        return create_response(403, {'error': 'Forbidden', 'message': 'Admin privileges required'})

    request_context = event.get('requestContext', {})
    http_context = request_context.get('http', {})
    method = http_context.get('method', 'GET')

    try:
        if method == 'GET':
            return list_users(event)
        elif method == 'PATCH':
            return update_user_role(event)
        else:
            return create_response(405, {'error': 'Method not allowed'})
    except Exception as e:
        print(f"Error: {str(e)}")
        return create_response(500, {'error': 'Internal server error', 'message': str(e)})


def _get_group_members(group_name: str) -> Set[str]:
    """Return the set of usernames in a given Cognito group."""
    usernames: Set[str] = set()
    kwargs: Dict[str, Any] = {'UserPoolId': USER_POOL_ID, 'GroupName': group_name, 'Limit': 60}
    while True:
        resp = cognito.list_users_in_group(**kwargs)
        for u in resp.get('Users', []):
            usernames.add(u['Username'])
        next_token = resp.get('NextToken')
        if not next_token:
            break
        kwargs['NextToken'] = next_token
    return usernames


def list_users(event: APIGatewayProxyEventV2) -> APIResponse:
    """List users with pagination. Derives each user's role from group membership."""
    query_params = event.get('queryStringParameters') or {}
    pagination_token = query_params.get('paginationToken')

    # Fetch group membership once — avoids N+1 Cognito calls
    admin_members = _get_group_members('admin')
    member_members = _get_group_members('member')

    kwargs: Dict[str, Any] = {'UserPoolId': USER_POOL_ID, 'Limit': 50}
    if pagination_token:
        kwargs['PaginationToken'] = pagination_token

    response = cognito.list_users(**kwargs)

    user_dtos: List[UserDto] = []
    for u in response.get('Users', []):
        attrs = {a['Name']: a['Value'] for a in u.get('Attributes', [])}
        username = u['Username']

        if username in admin_members:
            profile = 'admin'
        elif username in member_members:
            profile = 'member'
        else:
            profile = 'limited'

        user_dtos.append(UserDto(
            username=username,
            email=attrs.get('email'),
            name=attrs.get('name'),
            profile=profile,
            created_at=u['UserCreateDate'],
            updated_at=u['UserLastModifiedDate'],
        ))

    response_dto = UsersResponseDto(
        users=user_dtos,
        pagination_token=response.get('PaginationToken')
    )

    return create_response(200, response_dto.model_dump(by_alias=True))


def update_user_role(event: APIGatewayProxyEventV2) -> APIResponse:
    """Update a user's role by modifying their Cognito group memberships."""
    path_params = event.get('pathParameters') or {}
    target_username = path_params.get('username')

    if not target_username:
        return create_response(400, {'error': 'Bad request', 'message': 'Username is required in path'})

    body_str = event.get('body') or '{}'
    try:
        request_data = UpdateUserRoleRequest.model_validate_json(body_str)
    except ValidationError as ve:
        return create_response(400, {'error': 'Bad request', 'message': f'Validation failed: {ve.errors()}'})

    new_role = request_data.profile
    if new_role not in ('admin', 'member', 'limited'):
        return create_response(400, {'error': 'Bad request', 'message': "profile must be one of: admin, member, limited"})

    target_groups = {'admin': {'admin', 'member'}, 'member': {'member'}, 'limited': set()}[new_role]

    try:
        resp = cognito.admin_list_groups_for_user(Username=target_username, UserPoolId=USER_POOL_ID)
        current_groups = {g['GroupName'] for g in resp.get('Groups', [])}

        for group in target_groups - current_groups:
            cognito.admin_add_user_to_group(UserPoolId=USER_POOL_ID, Username=target_username, GroupName=group)

        for group in current_groups - target_groups:
            cognito.admin_remove_user_from_group(UserPoolId=USER_POOL_ID, Username=target_username, GroupName=group)

        return create_response(200, {'message': f'Updated {target_username} to {new_role}'})
    except cognito.exceptions.UserNotFoundException:
        return create_response(404, {'error': 'User not found'})
