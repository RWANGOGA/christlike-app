from pydantic import BaseModel, EmailStr, field_serializer
from typing import Optional, List, Any

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

class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    page_size: int
    pages: int

    @field_serializer('items')
    def serialize_items(self, items: List[Any]) -> List[dict]:
        result = []
        for item in items:
            if hasattr(item, '__dict__') and not isinstance(item, dict):
                result.append({k: v for k, v in item.__dict__.items() if not k.startswith('_')})
            else:
                result.append(item)
        return result

class PaginationParams(BaseModel):
    page: int = 1
    page_size: int = 20

class DevotionCreate(BaseModel):
    title: str
    date: str
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

class FactCreate(BaseModel):
    title: str
    category: str
    content: str
    bible_reference: Optional[str] = None
    difficulty_level: Optional[str] = "Beginner"

class PrayerRequestCreate(BaseModel):
    content: str
    is_anonymous: bool = False

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    faith_journey_stage: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None
    show_on_leaderboard: bool | None = None

class UserNoteCreate(BaseModel):
    title: str = "Untitled Note"
    note_text: str
    lesson_id: Optional[int] = None
    verse_id: Optional[int] = None

class UserNoteUpdate(BaseModel):
    title: Optional[str] = None
    note_text: Optional[str] = None

class ProgressUpdate(BaseModel):
    lesson_id: int
    status: str = "in_progress"
    progress_percentage: int = 0

class ChatMessage(BaseModel):
    recipient_id: int
    content: str
    content_type: str = "text"
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    file_size: Optional[int] = None
    reference_content_type: Optional[str] = None
    reference_content_id: Optional[int] = None
