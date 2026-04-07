import json
import os
import boto3
from typing import Any, Dict, List, Set
from shared import LambdaEvent, LambdaContext, LambdaResponse, get_user_info, create_response

cognito = boto3.client('cognito-idp')
USER_POOL_ID = os.environ.get('USER_POOL_ID')


def handler(event: LambdaEvent, context: LambdaContext) -> LambdaResponse:
    """
    GET  /users               – List users with their roles (admin only)
    PATCH /users/{username}   – Update a user's role (admin only)
    """
    user = get_user_info(event)

    if not user.is_authenticated or not user.is_admin:
        return create_response(403, {'error': 'Forbidden', 'message': 'Admin privileges required'})

    method = event.get('requestContext', {}).get('http', {}).get('method', 'GET')

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


def list_users(event: LambdaEvent) -> LambdaResponse:
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

    users: List[Dict[str, Any]] = []
    for u in response.get('Users', []):
        attrs = {a['Name']: a['Value'] for a in u.get('Attributes', [])}
        username = u['Username']

        if username in admin_members:
            profile = 'admin'
        elif username in member_members:
            profile = 'member'
        else:
            profile = 'limited'

        users.append({
            'username': username,
            'email': attrs.get('email'),
            'name': attrs.get('name'),
            'profile': profile,
        })

    return create_response(200, {
        'users': users,
        'paginationToken': response.get('PaginationToken'),
    })


def update_user_role(event: LambdaEvent) -> LambdaResponse:
    """Update a user's role by modifying their Cognito group memberships."""
    path_params = event.get('pathParameters') or {}
    target_username = path_params.get('username')

    if not target_username:
        return create_response(400, {'error': 'Bad request', 'message': 'Username is required in path'})

    try:
        body = json.loads(event.get('body') or '{}')
    except json.JSONDecodeError:
        return create_response(400, {'error': 'Bad request', 'message': 'Invalid JSON'})

    new_role = body.get('profile')
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
