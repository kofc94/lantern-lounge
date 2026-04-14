import base64
import hashlib
import io
import json
import os
import struct
import zipfile
import zlib
from typing import Any, Dict

import boto3
from cryptography.hazmat.primitives.serialization import load_pem_private_key, Encoding
from cryptography.hazmat.primitives.serialization.pkcs7 import (
    PKCS7SignatureBuilder,
    PKCS7Options,
)
from cryptography.hazmat.primitives import hashes
from cryptography.x509 import load_pem_x509_certificate

from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from mypy_boto3_ssm import SSMClient
    from aws_lambda_typing.events import APIGatewayProxyEventV2
    from aws_lambda_typing.context import Context
else:
    SSMClient = object
    APIGatewayProxyEventV2 = object
    Context = object

from shared import get_user_from_context
from domain import UserContext, APIResponse

_ssm: SSMClient = boto3.client("ssm")

def _get_asset(filename: str) -> bytes:
    """Read a local asset file bundled with the Lambda."""
    path = os.path.join(os.path.dirname(__file__), filename)
    if not os.path.exists(path):
        raise FileNotFoundError(f"Asset not found: {path}")
    with open(path, "rb") as f:
        return f.read()


def handler(event: APIGatewayProxyEventV2, context: Context) -> APIResponse:
    user = get_user_from_context(event)
    if not user.sub:
        return _error(401, "Unauthorized")

    try:
        pkpass_bytes = _build_pkpass(user)
    except _ConfigMissing as e:
        print(str(e))
        return _error(503, "Apple Wallet not configured")
    except Exception as e:
        print(f"Apple Wallet error: {e}")
        return _error(500, "Could not generate pass")

    return APIResponse(
        statusCode=200,
        headers={
            "Content-Type": "application/vnd.apple.pkpass",
            "Content-Disposition": 'attachment; filename="lanternlounge.pkpass"',
            "Access-Control-Allow-Origin": "*",
        },
        body=base64.b64encode(pkpass_bytes).decode(),
        isBase64Encoded=True,
    )


def _error(status: int, message: str) -> APIResponse:
    return APIResponse(
        statusCode=status,
        headers={"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
        body=json.dumps({"error": message}),
    )


class _ConfigMissing(Exception):
    pass


def _ssm_get(name: str, decrypt: bool = False) -> str:
    try:
        resp = _ssm.get_parameter(Name=name, WithDecryption=decrypt)
        val = resp.get("Parameter", {}).get("Value")
        if val is None:
            raise _ConfigMissing(f"Missing SSM parameter: {name}")
        return val
    except Exception:
        raise _ConfigMissing(f"Missing SSM parameter: {name}")


def _build_pkpass(user: UserContext) -> bytes:
    pass_type_id    = _ssm_get("/lantern-lounge/apple/wallet-pass-type-id")
    team_id         = _ssm_get("/lantern-lounge/apple/wallet-team-id")
    private_key_pem = _ssm_get("/lantern-lounge/apple/wallet-private-key",      decrypt=True)
    cert_pem        = _ssm_get("/lantern-lounge/apple/wallet-certificate-pem",   decrypt=True)
    wwdr_pem        = _ssm_get("/lantern-lounge/apple/wallet-wwdr-cert")

    private_key = load_pem_private_key(private_key_pem.encode(), password=None)
    cert        = load_pem_x509_certificate(cert_pem.encode())
    wwdr_cert   = load_pem_x509_certificate(wwdr_pem.encode())

    display_name = user.name or user.email or "Member"
    email  = user.email or user.sub
    serial = user.sub.replace("-", "")[:20]

    # Branding Colors
    bg_color     = "rgb(28, 25, 23)"    # Rich Dark
    fg_color     = "rgb(255, 255, 255)" # White
    label_color  = "rgb(197, 160, 89)"  # Lantern Gold (#C5A059)

    pass_json = json.dumps({
        "formatVersion": 1,
        "passTypeIdentifier": pass_type_id,
        "serialNumber": serial,
        "teamIdentifier": team_id,
        "organizationName": "The Lantern Lounge",
        "description": "Lantern Lounge Membership Card",
        "backgroundColor": bg_color,
        "foregroundColor": fg_color,
        "labelColor":      label_color,
        "storeCard": {
            "primaryFields": [
                {"key": "member", "label": "MEMBER", "value": display_name}
            ],
            "secondaryFields": [
                {"key": "since", "label": "MEMBER SINCE", "value": "2026"},
                {"key": "status", "label": "STATUS", "value": "Active Member"}
            ],
            "auxiliaryFields": [],
            "backFields": [
                {"key": "email",   "label": "Email",   "value": email},
                {"key": "location", "label": "Location", "value": "177 Bedford St, Lexington, MA"},
                {"key": "notice",  "label": "Legal",   "value": "This card is non-transferable and remains the property of The Lantern Lounge."}
            ],
        },
        "barcodes": [{
            "message": f"LL-CHECKIN:{email}",
            "format": "PKBarcodeFormatQR",
            "messageEncoding": "iso-8859-1",
            "altText": email,
        }],
    }, separators=(",", ":")).encode()

    files: Dict[str, bytes] = { "pass.json": pass_json }
    for res in ["icon{}.png", "logo{}.png", "strip{}.png"]:
        for scale in ["", "@2x", "@3x"]:
            try:
                filename = res.format(scale)
                files[filename] = _get_asset(f"assets/{filename}")
            except FileNotFoundError:
                pass # Missing assets are acceptable if not all scales are provided
    

    # manifest.json — SHA1 hash of every file in the bundle
    manifest = {name: hashlib.sha1(data).hexdigest() for name, data in files.items()}
    manifest_json = json.dumps(manifest, separators=(",", ":")).encode()

    # PKCS7 detached signature over manifest.json
    signature = (
        PKCS7SignatureBuilder()
        .set_data(manifest_json)
        .add_signer(cert, private_key, hashes.SHA256()) # type: ignore
        .add_certificate(wwdr_cert)
        .sign(Encoding.DER, [PKCS7Options.DetachedSignature, PKCS7Options.Binary])  # type: ignore[arg-type,list-item]
    )

    # Pack everything into a .pkpass ZIP
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for name, data in files.items():
            zf.writestr(name, data)
        zf.writestr("manifest.json", manifest_json)
        zf.writestr("signature", signature)
    return buf.getvalue()
