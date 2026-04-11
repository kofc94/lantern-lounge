import boto3
import os
import logging
from typing import Any, Dict

logger = logging.getLogger()
logger.setLevel(logging.INFO)

cognito = boto3.client("cognito-idp")
USER_POOL_ID: str = os.environ["USER_POOL_ID"]

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Pre-authentication trigger: blocks non-staff users from logging into the staff app.
    """
    client_id = event["callerContext"]["clientId"]
    username = event["userName"]
    
    logger.info(f"Pre-authentication trigger for user {username} on client {client_id}")
    
    # We need to know if this client_id belongs to the "checkin-app".
    # To avoid circular dependencies in Terraform, we look it up by name or just check tags?
    # Actually, we can just list clients and find the one named 'lantern-lounge-checkin-app'
    try:
        clients_resp = cognito.list_user_pool_clients(UserPoolId=USER_POOL_ID, MaxResults=60)
        checkin_client = next(
            (c for g in [clients_resp.get("UserPoolClients", [])] for c in g 
             if "checkin-app" in c.get("ClientName", "")), 
            None
        )
        
        if checkin_client and client_id == checkin_client["ClientId"]:
            logger.info("Enforcing staff check for checkin-app client")
            response = cognito.admin_list_groups_for_user(
                Username=username,
                UserPoolId=USER_POOL_ID
            )
            
            groups = [g["GroupName"] for g in response.get("Groups", [])]
            is_staff = "staff" in groups or "admin" in groups
            
            if not is_staff:
                logger.warning(f"Blocking non-staff user {username} from check-in app")
                raise Exception("Access Denied: You do not have staff permissions to access this application.")
    except Exception as e:
        if "Access Denied" in str(e):
            raise e
        logger.error(f"Error in pre-auth trigger: {e}")
            
    return event
