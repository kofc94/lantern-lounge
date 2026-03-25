import json
import os
import boto3
from typing import Any, Dict, List, Optional
from shared import LambdaEvent, LambdaContext, LambdaResponse, get_user_info, create_response

cognito = boto3.client('cognito-idp')
USER_POOL_ID = os.environ.get('USER_POOL_ID')

MANAGED_GROUPS = {'admin', 'member', 'limited'}

def handler(event: LambdaEvent, context: LambdaContext) -> LambdaResponse:
    """
    Handle user listing and group updates.
    GET /users - List users with pagination
    PATCH /users/{username} - Update user's managed groups
    """
    user = get_user_info(event)
    
    # Only admins can access this API
    if not user.is_authenticated or not user.is_admin:
        return create_response(403, {'error': 'Forbidden', 'message': 'Admin privileges required'})

    request_context = event.get('requestContext', {})
    http_method = request_context.get('http', {}).get('method', 'GET')
    
    try:
        if http_method == 'GET':
            return list_users(event)
        elif http_method == 'PATCH':
            return update_user_groups(event)
        else:
            return create_response(405, {'error': 'Method not allowed'})
    except Exception as e:
        print(f"Error: {str(e)}")
        return create_response(500, {'error': 'Internal server error', 'message': str(e)})

def list_users(event: LambdaEvent) -> LambdaResponse:
    """List users in the Cognito User Pool."""
    query_params = event.get('queryStringParameters', {}) or {}
    pagination_token = query_params.get('paginationToken')
    limit = int(query_params.get('limit', '50'))

    params = {
        'UserPoolId': USER_POOL_ID,
        'Limit': limit
    }
    if pagination_token:
        params['PaginationToken'] = pagination_token

    response = cognito.list_users(**params)
    users_raw = response.get('Users', [])
    
    users = []
    for u in users_raw:
        attributes = {attr['Name']: attr['Value'] for attr in u.get('Attributes', [])}
        username = u.get('Username')
        
        # Get groups for this user
        groups_response = cognito.admin_list_groups_for_user(
            UserPoolId=USER_POOL_ID,
            Username=username
        )
        groups = [g['GroupName'] for g in groups_response.get('Groups', [])]

        users.append({
            'username': username,
            'email': attributes.get('email'),
            'name': attributes.get('name'),
            'status': u.get('UserStatus'),
            'enabled': u.get('Enabled'),
            'created': u.get('UserCreateDate').isoformat() if u.get('UserCreateDate') else None,
            'lastModified': u.get('UserLastModifiedDate').isoformat() if u.get('UserLastModifiedDate') else None,
            'groups': groups
        })

    return create_response(200, {
        'users': users,
        'paginationToken': response.get('PaginationToken')
    })

def update_user_groups(event: LambdaEvent) -> LambdaResponse:
    """Update a user's managed group membership via PATCH."""
    path_params = event.get('pathParameters', {}) or {}
    target_username = path_params.get('username')
    
    if not target_username:
        return create_response(400, {'error': 'Bad request', 'message': 'Username is required in path'})

    body = json.loads(event.get('body', '{}'))
    new_groups_input = body.get('groups')

    if not isinstance(new_groups_input, list):
        return create_response(400, {'error': 'Bad request', 'message': 'Payload must contain a "groups" list'})

    # Only consider groups we are allowed to manage
    new_managed_groups = set(new_groups_input).intersection(MANAGED_GROUPS)

    # 1. Get current groups
    groups_response = cognito.admin_list_groups_for_user(
        UserPoolId=USER_POOL_ID,
        Username=target_username
    )
    current_groups = {g['GroupName'] for g in groups_response.get('Groups', [])}
    current_managed_groups = current_groups.intersection(MANAGED_GROUPS)

    # 2. Identify changes
    groups_to_add = new_managed_groups - current_managed_groups
    groups_to_remove = current_managed_groups - new_managed_groups

    # 3. Apply changes
    for group_name in groups_to_add:
        cognito.admin_add_user_to_group(
            UserPoolId=USER_POOL_ID,
            Username=target_username,
            GroupName=group_name
        )

    for group_name in groups_to_remove:
        cognito.admin_remove_user_from_group(
            UserPoolId=USER_POOL_ID,
            Username=target_username,
            GroupName=group_name
        )

    return create_response(200, {
        'message': f'Updated groups for {target_username}',
        'added': list(groups_to_add),
        'removed': list(groups_to_remove)
    })
