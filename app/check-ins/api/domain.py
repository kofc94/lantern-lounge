from typing import List, Optional, Any, Dict, TypedDict
from typing_extensions import NotRequired
from pydantic import BaseModel, Field, ConfigDict
from pydantic.alias_generators import to_camel
from datetime import datetime

class CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )

class AppConfig(CamelModel):
    checkins_table: str
    non_members_table: str
    cognito_api_endpoint: str

class UserContext(CamelModel):
    sub: str
    email: Optional[str] = None
    name: Optional[str] = None
    groups: List[str] = Field(default_factory=list)

class CognitoUser(BaseModel):
    sub: str
    name: str

class GuestDto(CamelModel):
    name: str = ""
    email: str = ""

class GuestResultDto(CamelModel):
    name: str
    email: str
    visit_count: int

class CheckInResponseDto(CamelModel):
    id: str
    user_id: str
    user_name: str
    timestamp: str

class GuestCheckInRequest(CamelModel):
    guests: List[GuestDto] = Field(default_factory=list)

class GuestCheckInResponseDto(CamelModel):
    id: str
    guests: List[GuestResultDto] = Field(default_factory=list)

class WalletPassResponseDto(CamelModel):
    wallet_token: str
    google_save_url: Optional[str] = None

class ManualCheckInRequest(CamelModel):
    email: Optional[str] = None

class APIResponse(TypedDict):
    statusCode: int
    headers: Dict[str, str]
    body: str
    isBase64Encoded: NotRequired[bool]
