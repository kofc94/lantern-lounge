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
    Post-confirmation trigger: auto-assigns users to the 'limited' group.
    """
    cognito.admin_add_user_to_group(
        UserPoolId=event["userPoolId"],
        Username=event["userName"],
        GroupName="limited",
    )
    return event
