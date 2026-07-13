# backend/schemas.py
from pydantic import BaseModel, EmailStr
from typing import Optional

class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    username: str
    faith_journey_stage: Optional[str] = None
    is_admin: bool = False 

    class Config:
        from_attributes = True
        
# ==================== ADMIN CONTENT SCHEMAS ====================
class DevotionCreate(BaseModel):
    title: str
    date: str  # Format: "YYYY-MM-DD"
    bible_reference: str
    content: str
    author: str
    is_published: bool = True

class SermonSeriesCreate(BaseModel):
    title: str
    description: str
    speaker_name: str
    thumbnail_url: str | None = None

class SermonCreate(BaseModel):
    title: str
    description: str
    speaker_name: str
    video_url: str
    bible_passage: str | None = None        
# ==================== FACTS & PRAYER SCHEMAS ====================
class FactCreate(BaseModel):
    title: str
    category: str
    content: str
    bible_reference: Optional[str] = None
    difficulty_level: Optional[str] = "Beginner"

class PrayerRequestCreate(BaseModel):
    content: str
    is_anonymous: bool = False

# ==================== SETTINGS & STREAK SCHEMAS ====================
class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    faith_journey_stage: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None
