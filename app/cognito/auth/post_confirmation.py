import boto3
import os
from typing import Any, Dict

# Type aliases for AWS Lambda
LambdaEvent = Dict[str, Any]
LambdaContext = Any

cognito = boto3.client("cognito-idp")

def handler(event: LambdaEvent, context: LambdaContext) -> LambdaEvent:
    """
    Post-confirmation trigger: 
    1. Sets default profile attribute to 'limited'
    2. Adds user to the 'user' group
    """
    user_pool_id = event["userPoolId"]
    username = event["userName"]

    # 1. Set the 'profile' attribute to 'limited'
    cognito.admin_update_user_attributes(
        UserPoolId=user_pool_id,
        Username=username,
        UserAttributes=[
            {
                "Name": "profile",
                "Value": "limited"
            }
        ]
    )

    # 2. Add to 'user' group
    cognito.admin_add_user_to_group(
        UserPoolId=user_pool_id,
        Username=username,
        GroupName="user",
    )

    return event
