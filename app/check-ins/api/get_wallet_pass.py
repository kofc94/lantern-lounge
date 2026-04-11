import json
import time
import boto3
from typing import Any, Dict, Optional

from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from mypy_boto3_ssm import SSMClient
    from aws_lambda_typing.events import APIGatewayProxyEventV2
    from aws_lambda_typing.context import Context
else:
    SSMClient = object
    APIGatewayProxyEventV2 = object
    Context = object

from shared import get_response, get_user_from_context
from domain import UserContext, APIResponse, WalletPassResponseDto

_ssm: SSMClient = boto3.client("ssm")

def handler(event: APIGatewayProxyEventV2, context: Context) -> APIResponse:
    user = get_user_from_context(event)
    if not user.sub:
        return get_response(401, {"error": "Unauthorized"})

    wallet_token = f"LL-{user.sub}"
    google_save_url = _build_google_wallet_url(user)
    
    response_dto = WalletPassResponseDto(
        wallet_token=wallet_token,
        google_save_url=google_save_url
    )

    return get_response(200, response_dto.model_dump(exclude_none=True, by_alias=True))

def _build_google_wallet_url(user: UserContext) -> Optional[str]:
    """Returns an 'Add to Google Wallet' URL, or None if not configured."""
    try:
        import jwt as pyjwt
        from cryptography.hazmat.primitives.serialization import load_pem_private_key
    except ImportError as e:
        print(f"Wallet deps not available: {e}")
        return None

    try:
        issuer_resp = _ssm.get_parameter(Name="/lantern-lounge/google/wallet-issuer-id")
        val = issuer_resp.get("Parameter", {}).get("Value", "")
        issuer_id = val.strip()
    except Exception as e:
        print("Google Wallet issuer ID not configured; skipping", e)
        return None

    try:
        key_resp = _ssm.get_parameter(
            Name="/lantern-lounge/google/wallet-service-account-key",
            WithDecryption=True,
        )
        sa_key_str = key_resp.get("Parameter", {}).get("Value", "")
        sa_key = json.loads(sa_key_str)
    except Exception as e:
        print(f"Could not load wallet service account key: {e}")
        return None

    sub_safe = user.sub.replace("-", "_")
    object_id = f"{issuer_id}.ll_{sub_safe}"
    class_id = f"{issuer_id}.lantern_lounge_membership"
    display_name = user.name or user.email or "Member"

    pass_object = {
        "id": object_id,
        "classId": class_id,
        "genericType": "GENERIC_TYPE_UNSPECIFIED",
        "hexBackgroundColor": "#1a1a1a",
        "cardTitle": {
            "defaultValue": {"language": "en-US", "value": "Lantern Lounge"}
        },
        "subheader": {
            "defaultValue": {"language": "en-US", "value": "Membership Card"}
        },
        "header": {
            "defaultValue": {"language": "en-US", "value": display_name}
        },
        "barcode": {
            "type": "QR_CODE",
            "value": user.email or user.sub,
        },
        "state": "ACTIVE",
    }

    jwt_payload = {
        "iss": sa_key.get("client_email", ""),
        "aud": "google",
        "typ": "savetowallet",
        "iat": int(time.time()),
        "payload": {"genericObjects": [pass_object]},
    }

    try:
        private_key = load_pem_private_key(
            sa_key.get("private_key", "").encode(),
            password=None,
        )
        token = pyjwt.encode(jwt_payload, private_key, algorithm="RS256")
        token_str = token.decode("utf-8") if isinstance(token, bytes) else token
        return f"https://pay.google.com/gp/v/save/{token_str}"
    except Exception as e:
        print(f"JWT signing failed: {e}")
        return None
