import json
import os
import boto3
from typing import Any, Dict, List, Optional
from shared import LambdaEvent, LambdaContext, LambdaResponse, get_user_info, create_response

cognito = boto3.client('cognito-idp')
USER_POOL_ID = os.environ.get('USER_POOL_ID')

def handler(event: LambdaEvent, context: LambdaContext) -> LambdaResponse:
    """
    Handle user listing and group updates.
    GET /users - List users with pagination
    POST /users/update-group - Update user's group
    """
    user = get_user_info(event)
    
    # Only admins can access this API
    if not user.is_authenticated or not user.is_admin:
        return create_response(403, {'error': 'Forbidden', 'message': 'Admin privileges required'})

    http_method = event.get('requestContext', {}).get('http', {}).get('method', 'GET')
    
    try:
        if http_method == 'GET':
            return list_users(event)
        elif http_method == 'POST':
            return update_user_group(event)
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

def update_user_group(event: LambdaEvent) -> LambdaResponse:
    """Update a user's group membership."""
    body = json.loads(event.get('body', '{}'))
    target_username = body.get('username')
    target_group = body.get('group')

    if not target_username or not target_group:
        return create_response(400, {'error': 'Bad request', 'message': 'Username and group are required'})

    valid_groups = ['admin', 'member', 'limited']
    if target_group not in valid_groups:
        return create_response(400, {'error': 'Bad request', 'message': f'Invalid group. Must be one of: {valid_groups}'})

    # 1. Get current groups
    groups_response = cognito.admin_list_groups_for_user(
        UserPoolId=USER_POOL_ID,
        Username=target_username
    )
    current_groups = [g['GroupName'] for g in groups_response.get('Groups', [])]

    # 2. Remove from all other target groups to ensure mutual exclusivity
    for g in valid_groups:
        if g in current_groups and g != target_group:
            cognito.admin_remove_user_from_group(
                UserPoolId=USER_POOL_ID,
                Username=target_username,
                GroupName=g
            )

    # 3. Add to the new group if not already there
    if target_group not in current_groups:
        cognito.admin_add_user_to_group(
            UserPoolId=USER_POOL_ID,
            Username=target_username,
            GroupName=target_group
        )

    return create_response(200, {'message': f'User {target_username} updated to group {target_group}'})
