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
    
    # New flexible API: supports 'group' (legacy) OR ('action' + 'value')
    target_group = body.get('group')
    action = body.get('action') # 'toggle_admin' or 'set_membership'
    value = body.get('value')   # boolean for toggle_admin, string for set_membership

    if not target_username:
        return create_response(400, {'error': 'Bad request', 'message': 'Username is required'})

    # 1. Get current groups
    groups_response = cognito.admin_list_groups_for_user(
        UserPoolId=USER_POOL_ID,
        Username=target_username
    )
    current_groups = [g['GroupName'] for g in groups_response.get('Groups', [])]

    # Handle the new UI requirements: Admin checkbox + Membership radio
    if action == 'toggle_admin':
        if value: # Add admin
            if 'admin' not in current_groups:
                cognito.admin_add_user_to_group(UserPoolId=USER_POOL_ID, Username=target_username, GroupName='admin')
        else: # Remove admin
            if 'admin' in current_groups:
                cognito.admin_remove_user_from_group(UserPoolId=USER_POOL_ID, Username=target_username, GroupName='admin')
        return create_response(200, {'message': f'Admin status updated for {target_username}'})

    elif action == 'set_membership':
        if value not in ['member', 'limited']:
            return create_response(400, {'error': 'Bad request', 'message': 'Membership must be member or limited'})
        
        other = 'limited' if value == 'member' else 'member'
        
        # Add to new membership group
        if value not in current_groups:
            cognito.admin_add_user_to_group(UserPoolId=USER_POOL_ID, Username=target_username, GroupName=value)
        
        # Remove from old membership group
        if other in current_groups:
            cognito.admin_remove_user_from_group(UserPoolId=USER_POOL_ID, Username=target_username, GroupName=other)
            
        return create_response(200, {'message': f'Membership for {target_username} set to {value}'})

    # Legacy support for the simple dropdown
    elif target_group:
        valid_groups = ['admin', 'member', 'limited']
        if target_group not in valid_groups:
            return create_response(400, {'error': 'Bad request', 'message': f'Invalid group. Must be one of: {valid_groups}'})

        # Remove from all other target groups to ensure mutual exclusivity (legacy behavior)
        for g in valid_groups:
            if g in current_groups and g != target_group:
                cognito.admin_remove_user_from_group(UserPoolId=USER_POOL_ID, Username=target_username, GroupName=g)

        # Add to the new group if not already there
        if target_group not in current_groups:
            cognito.admin_add_user_to_group(UserPoolId=USER_POOL_ID, Username=target_username, GroupName=target_group)

        return create_response(200, {'message': f'User {target_username} updated to group {target_group}'})

    return create_response(400, {'error': 'Bad request', 'message': 'Missing action or group'})
