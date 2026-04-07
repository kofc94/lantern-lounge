import json
import time
import boto3
from shared import get_response, get_user_from_context

_ssm = boto3.client("ssm")


def handler(event, context):
    user = get_user_from_context(event)
    if not user.get("sub"):
        return get_response(401, {"error": "Unauthorized"})

    wallet_token = f"LL-{user['sub']}"
    result = {"wallet_token": wallet_token}

    google_save_url = _build_google_wallet_url(user)
    if google_save_url:
        result["google_save_url"] = google_save_url

    return get_response(200, result)


def _build_google_wallet_url(user):
    """Returns an 'Add to Google Wallet' URL, or None if not configured."""
    try:
        import jwt as pyjwt
        from cryptography.hazmat.primitives.serialization import load_pem_private_key
    except ImportError as e:
        print(f"Wallet deps not available: {e}")
        return None

    # Get Issuer ID (set manually by admin after registering at pay.google.com/business/console)
    try:
        issuer_resp = _ssm.get_parameter(Name="/lantern-lounge/google/wallet-issuer-id")
        issuer_id = issuer_resp["Parameter"]["Value"].strip()
    except _ssm.exceptions.ParameterNotFound:
        print("Google Wallet issuer ID not configured; skipping")
        return None

    # Get service account key (created by GCP Terraform in infrastructure/gcp)
    try:
        key_resp = _ssm.get_parameter(
            Name="/lantern-lounge/google/wallet-service-account-key",
            WithDecryption=True,
        )
        sa_key = json.loads(key_resp["Parameter"]["Value"])
    except Exception as e:
        print(f"Could not load wallet service account key: {e}")
        return None

    # Build a Generic pass object for the member
    sub_safe = user["sub"].replace("-", "_")
    object_id = f"{issuer_id}.ll_{sub_safe}"
    class_id = f"{issuer_id}.lantern_lounge_membership"
    display_name = user.get("name") or user.get("email", "Member")

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
            "value": user.get("email", user["sub"]),
        },
        "state": "ACTIVE",
    }

    jwt_payload = {
        "iss": sa_key["client_email"],
        "aud": "google",
        "typ": "savetowallet",
        "iat": int(time.time()),
        "payload": {"genericObjects": [pass_object]},
    }

    try:
        private_key = load_pem_private_key(
            sa_key["private_key"].encode(),
            password=None,
        )
        token = pyjwt.encode(jwt_payload, private_key, algorithm="RS256")
        return f"https://pay.google.com/gp/v/save/{token}"
    except Exception as e:
        print(f"JWT signing failed: {e}")
        return None
