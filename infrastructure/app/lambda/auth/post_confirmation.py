import boto3
import os
from typing import Any, Dict

# Type aliases for AWS Lambda
LambdaEvent = Dict[str, Any]
LambdaContext = Any

cognito = boto3.client("cognito-idp")
USER_POOL_ID: str = os.environ["USER_POOL_ID"]

def handler(event: LambdaEvent, context: LambdaContext) -> LambdaEvent:
    """
    Post-confirmation trigger: auto-assigns users to the 'member' group.
    """
    cognito.admin_add_user_to_group(
        UserPoolId=USER_POOL_ID,
        Username=event["userName"],
        GroupName="member",
    )
    return event
