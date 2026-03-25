import boto3
import os
from typing import Any, Dict

# Type aliases for AWS Lambda
LambdaEvent = Dict[str, Any]
LambdaContext = Any

cognito = boto3.client("cognito-idp")

# List of manual admin usernames
# For Google users, these are usually 'Google_<sub_id>'
ADMIN_USERS = [
    "Google_104269928361937576762"
]

def handler(event: LambdaEvent, context: LambdaContext) -> LambdaEvent:
    """
    Post-confirmation trigger: 
    1. Determines if user is an admin
    2. Sets 'profile' attribute (admin, member, or limited)
    3. Adds user to the 'user' group (and 'admin' group if applicable)
    """
    user_pool_id = event["userPoolId"]
    username = event["userName"]
    
    is_admin = username in ADMIN_USERS
    role = "admin" if is_admin else "limited"

    # 1. Set the 'profile' attribute
    cognito.admin_update_user_attributes(
        UserPoolId=user_pool_id,
        Username=username,
        UserAttributes=[
            {
                "Name": "profile",
                "Value": role
            }
        ]
    )

    # 2. Add to 'user' group
    cognito.admin_add_user_to_group(
        UserPoolId=user_pool_id,
        Username=username,
        GroupName="user",
    )
    
    # 3. Add to 'admin' group if applicable
    if is_admin:
        cognito.admin_add_user_to_group(
            UserPoolId=user_pool_id,
            Username=username,
            GroupName="admin",
        )

    return event
