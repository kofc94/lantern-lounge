import boto3
import os

cognito = boto3.client("cognito-idp")
USER_POOL_ID = os.environ["USER_POOL_ID"]


def handler(event, context):
    cognito.admin_add_user_to_group(
        UserPoolId=USER_POOL_ID,
        Username=event["userName"],
        GroupName="member",
    )
    return event
