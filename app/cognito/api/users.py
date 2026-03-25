import json
import os
import boto3
from typing import Any, Dict, List, Optional
from shared import LambdaEvent, LambdaContext, LambdaResponse, get_user_info, create_response

cognito = boto3.client('cognito-idp')
USER_POOL_ID = os.environ.get('USER_POOL_ID')

def handler(event: LambdaEvent, context: LambdaContext) -> LambdaResponse:
    """
    Handle user listing and role updates using the 'profile' attribute.
    GET /users - List users with pagination
    PATCH /users/{username} - Update user's profile role
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
            return update_user_role(event)
        else:
            return create_response(405, {'error': 'Method not allowed'})
    except Exception as e:
        print(f"Error: {str(e)}")
        return create_response(500, {'error': 'Internal server error', 'message': str(e)})

def list_users(event: LambdaEvent) -> LambdaResponse:
    """List users in the Cognito User Pool (Optimized: No per-user group calls)."""
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
        
        # derive role from 'profile' attribute
        role = attributes.get('profile', 'limited')

        users.append({
            'username': username,
            'email': attributes.get('email'),
            'name': attributes.get('name'),
            'profile': role, # New primary role indicator
            'status': u.get('UserStatus'),
            'enabled': u.get('Enabled'),
            'created': u.get('UserCreateDate').isoformat() if u.get('UserCreateDate') else None,
            'lastModified': u.get('UserLastModifiedDate').isoformat() if u.get('UserLastModifiedDate') else None
        })

    return create_response(200, {
        'users': users,
        'paginationToken': response.get('PaginationToken')
    })

def update_user_role(event: LambdaEvent) -> LambdaResponse:
    """Update a user's role by setting the 'profile' attribute and syncing 'admin' group."""
    path_params = event.get('pathParameters', {}) or {}
    target_username = path_params.get('username')
    
    if not target_username:
        return create_response(400, {'error': 'Bad request', 'message': 'Username is required in path'})

    body = json.loads(event.get('body', '{}'))
    # New expectation: payload is { "profile": "admin" | "member" | "limited" }
    new_role = body.get('profile')

    if new_role not in ['admin', 'member', 'limited']:
        return create_response(400, {'error': 'Bad request', 'message': 'Invalid profile role'})

    # 1. Update the 'profile' attribute
    cognito.admin_update_user_attributes(
        UserPoolId=USER_POOL_ID,
        Username=target_username,
        UserAttributes=[
            {
                "Name": "profile",
                "Value": new_role
            }
        ]
    )

    # 2. Sync Cognito Group for 'admin' (if needed for API Gateway v2 group authorizers)
    # This is secondary to the 'profile' attribute but useful for group claims
    try:
        if new_role == 'admin':
            cognito.admin_add_user_to_group(UserPoolId=USER_POOL_ID, Username=target_username, GroupName='admin')
        else:
            # Safely try to remove if it existed
            try:
                cognito.admin_remove_user_from_group(UserPoolId=USER_POOL_ID, Username=target_username, GroupName='admin')
            except cognito.exceptions.ResourceNotFoundException:
                pass
    except Exception as e:
        print(f"Error syncing group: {str(e)}")

    return create_response(200, {
        'message': f'Updated profile for {target_username} to {new_role}'
    })
