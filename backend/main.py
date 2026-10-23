# backend/main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Depends, status, WebSocket, WebSocketDisconnect, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import JSONResponse, FileResponse
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func as sql_func, desc, inspect as sa_inspect
from starlette.status import HTTP_404_NOT_FOUND
from datetime import datetime, timedelta, timezone
from pathlib import Path
import os
import httpx
import secrets
import logging
import uuid
from typing import List, Optional, Dict
from sqlalchemy.orm import joinedload, selectinload, object_session
from database import engine, get_db, Base, SessionLocal
from models import (
    BibleBook, BibleChapter, BibleVerse, 
    Category, Lesson, SermonSeries, Sermon,
    Devotion, FactForFaith, PrayerRequest,
    User, UserProgress, ContentCompletion,
    UserNote, UserHighlight, ChatMessage as ChatMessageModel, ChatFile
)
from schemas import (
    UserCreate, UserLogin, Token, UserResponse,
    DevotionCreate, SermonSeriesCreate, SermonCreate,
    FactCreate, PrayerRequestCreate, UserUpdate,
    PaginatedResponse, PaginationParams, ProgressUpdate,
    UserNoteCreate, UserNoteUpdate, ChatMessageIn
)
from auth import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_current_user,
)
from email_utils import send_password_reset_email
from config import settings
from logging_middleware import RequestLoggingMiddleware
from rate_limit import RateLimitMiddleware, rate_limiter, parse_rate
from chat import manager, UPLOAD_DIR, ALLOWED_EXTENSIONS, active_connections, cleanup_expired_files, is_expired

logger = logging.getLogger("christlike.api")

# Chat routes are written in async style, so they cannot use the sync
# `Depends(get_db)` generator for the *websocket* handler. They go through
# this indirection instead, which lets tests redirect them to the SQLite
# session (dependency_overrides only affect `Depends`, not direct calls).
def db_session() -> Session:
    return SessionLocal()

@asynccontextmanager
async def lifespan(app: FastAPI):
    import asyncio
    stop_event = asyncio.Event()
    task = asyncio.create_task(cleanup_expired_files(db_session, stop_event))
    try:
        yield
    finally:
        stop_event.set()
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass

app = FastAPI(title="JOAPP Clone API", lifespan=lifespan)

app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(RateLimitMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
    max_age=600,
)

# ==================== AUTH ENDPOINTS ====================

@app.post("/auth/register", response_model=UserResponse)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """Create a new user account"""
    existing_email = db.query(User).filter(User.email == user_in.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")

    existing_username = db.query(User).filter(User.username == user_in.username).first()
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")

    new_user = User(
        email=user_in.email,
        username=user_in.username,
        hashed_password=get_password_hash(user_in.password),
        is_admin=user_in.email.lower() in settings.admin_emails_set,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user

@app.post("/auth/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Log in and receive a JWT access token.
    Note: the frontend sends the user's email in the 'username' field,
    matching FastAPI's standard OAuth2PasswordRequestForm shape.
    """
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

# ==================== USER NOTES ====================
@app.get("/api/notes")
def get_user_notes(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get all notes for the current user"""
    notes = db.query(UserNote).filter(UserNote.user_id == current_user.id).order_by(UserNote.created_at.desc()).all()
    return notes

@app.post("/api/notes")
def create_note(data: UserNoteCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Create a new note"""
    new_note = UserNote(
        user_id=current_user.id,
        title=data.title,
        note_text=data.note_text,
        lesson_id=data.lesson_id,
        verse_id=data.verse_id
    )
    db.add(new_note)
    db.commit()
    db.refresh(new_note)
    return new_note

@app.patch("/api/notes/{note_id}")
def update_note(note_id: int, data: UserNoteUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Update an existing note"""
    note = db.query(UserNote).filter(UserNote.id == note_id, UserNote.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    if data.title is not None:
        note.title = data.title
    if data.note_text is not None:
        note.note_text = data.note_text
    
    db.commit()
    db.refresh(note)
    return note

@app.delete("/api/notes/{note_id}")
def delete_note(note_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Delete a note"""
    note = db.query(UserNote).filter(UserNote.id == note_id, UserNote.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    db.delete(note)
    db.commit()
    return {"message": "Note deleted"}

# ==================== CURRENT USER ENDPOINTS ====================

@app.get("/users/me", response_model=UserResponse)
def read_current_user(current_user: User = Depends(get_current_user)):
    """Get the currently authenticated user's profile"""
    return current_user

@app.get("/users/me/progress")
def read_current_user_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    params: PaginationParams = Depends(),
):
    """Get the currently authenticated user's lesson progress"""
    query = db.query(UserProgress).filter(UserProgress.user_id == current_user.id)
    total = query.count()
    items = query.offset((params.page - 1) * params.page_size).limit(params.page_size).all()
    return PaginatedResponse(
        items=items,
        total=total,
        page=params.page,
        page_size=params.page_size,
        pages=(total + params.page_size - 1) // params.page_size,
    )

# ==================== BIBLE API ENDPOINTS ====================
BIBLE_TRANSLATION = "BSB"  # Berean Standard Bible - public domain, modern English

@app.get("/api/bible/books")
async def get_bible_books():
    """Fetch the full list of Bible books (with chapter counts) from bible.helloao.org"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"https://bible.helloao.org/api/{BIBLE_TRANSLATION}/books.json")
            response.raise_for_status()
            data = response.json()
            books = [
                {
                    "bookid": b["id"],
                    "name": b.get("commonName") or b.get("name"),
                    "chapters": b["numberOfChapters"],
                }
                for b in data.get("books", [])
            ]
            return books
    except httpx.HTTPError as e:
        print(f"Bible API (books) fetch failed: {type(e).__name__}: {e}")
        raise HTTPException(status_code=502, detail="Failed to reach Bible API")

@app.get("/api/bible/chapter/{book_id}/{chapter}")
async def get_bible_chapter(book_id: str, chapter: int):
    """Fetch all verses for a specific book + chapter from bible.helloao.org."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"https://bible.helloao.org/api/{BIBLE_TRANSLATION}/{book_id}/{chapter}.json"
            )
            response.raise_for_status()
            data = response.json()
            content = data.get("chapter", {}).get("content", [])

            verses = []
            for item in content:
                if item.get("type") != "verse":
                    continue

                text_parts = []
                for part in item.get("content", []):
                    if isinstance(part, str):
                        text_parts.append(part)
                    elif isinstance(part, dict) and "text" in part:
                        text_parts.append(part["text"])

                verses.append({
                    "pk": f"{book_id}-{chapter}-{item['number']}",
                    "verse": item["number"],
                    "text": " ".join(text_parts).strip(),
                })

            if not verses:
                raise HTTPException(status_code=404, detail="Chapter not found")
            return verses
    except httpx.HTTPError as e:
        print(f"Bible API (chapter) fetch failed: {type(e).__name__}: {e}")
        raise HTTPException(status_code=502, detail="Failed to reach Bible API")

# ==================== CONTENT ENDPOINTS ====================
@app.get("/api/categories")
def get_categories(db: Session = Depends(get_db), params: PaginationParams = Depends()):
    """Get all discipleship categories"""
    query = db.query(Category).order_by(Category.order_index)
    total = query.count()
    items = query.offset((params.page - 1) * params.page_size).limit(params.page_size).all()
    return PaginatedResponse(
        items=items,
        total=total,
        page=params.page,
        page_size=params.page_size,
        pages=(total + params.page_size - 1) // params.page_size,
    )

@app.get("/api/categories/{category_id}/lessons")
def get_lessons(category_id: int, db: Session = Depends(get_db), params: PaginationParams = Depends()):
    """Get all lessons in a category"""
    query = db.query(Lesson).filter(Lesson.category_id == category_id)
    total = query.count()
    items = query.offset((params.page - 1) * params.page_size).limit(params.page_size).all()
    return PaginatedResponse(
        items=items,
        total=total,
        page=params.page,
        page_size=params.page_size,
        pages=(total + params.page_size - 1) // params.page_size,
    )

@app.get("/api/sermon-series")
def get_sermon_series(db: Session = Depends(get_db), params: PaginationParams = Depends()):
    """Get all sermon series"""
    query = db.query(SermonSeries).filter(SermonSeries.is_active == True)
    total = query.count()
    items = query.order_by(SermonSeries.start_date.desc()).offset((params.page - 1) * params.page_size).limit(params.page_size).all()
    return PaginatedResponse(
        items=items,
        total=total,
        page=params.page,
        page_size=params.page_size,
        pages=(total + params.page_size - 1) // params.page_size,
    )

@app.get("/api/sermon-series/{series_id}/sermons")
def get_sermons(series_id: int, db: Session = Depends(get_db)):
    """Get all sermons in a series"""
    sermons = db.query(Sermon).filter(Sermon.series_id == series_id).order_by(Sermon.order_index).all()
    return sermons

@app.get("/api/devotions")
def get_devotions(db: Session = Depends(get_db), params: PaginationParams = Depends()):
    """Get published devotions"""
    query = db.query(Devotion).filter(Devotion.is_published == True)
    total = query.count()
    items = query.order_by(Devotion.date.desc()).offset((params.page - 1) * params.page_size).limit(params.page_size).all()
    return PaginatedResponse(
        items=items,
        total=total,
        page=params.page,
        page_size=params.page_size,
        pages=(total + params.page_size - 1) // params.page_size,
    )

@app.get("/api/devotions/today")
def get_today_devotion(db: Session = Depends(get_db)):
    """Get today's devotion"""
    today = datetime.now().date()
    devotion = db.query(Devotion).filter(
        Devotion.is_published == True,
        Devotion.date >= today
    ).first()
    return devotion

@app.get("/api/facts-for-faith")
def get_facts_for_faith(db: Session = Depends(get_db), params: PaginationParams = Depends()):
    """Get all facts for faith"""
    query = db.query(FactForFaith)
    total = query.count()
    items = query.order_by(FactForFaith.order_index).offset((params.page - 1) * params.page_size).limit(params.page_size).all()
    return PaginatedResponse(
        items=items,
        total=total,
        page=params.page,
        page_size=params.page_size,
        pages=(total + params.page_size - 1) // params.page_size,
    )

# ==================== USER PROGRESS ENDPOINTS ====================
@app.get("/api/users/{user_id}/progress")
def get_user_progress(user_id: int, db: Session = Depends(get_db)):
    """Get user's progress across all lessons"""
    progress = db.query(UserProgress).filter(UserProgress.user_id == user_id).all()
    return progress

@app.post("/api/users/{user_id}/progress")
def update_progress(user_id: int, progress_data: ProgressUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Update user progress for a lesson"""
    if user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    existing = db.query(UserProgress).filter(
        UserProgress.user_id == user_id,
        UserProgress.lesson_id == progress_data.lesson_id
    ).first()
    
    if existing:
        existing.status = progress_data.status
        existing.progress_percentage = progress_data.progress_percentage
        if progress_data.status == "completed":
            existing.completed_at = datetime.now(timezone.utc)
        db.commit()
        return existing
    else:
        new_progress = UserProgress(
            user_id=user_id,
            lesson_id=progress_data.lesson_id,
            status=progress_data.status,
            progress_percentage=progress_data.progress_percentage,
            completed_at=datetime.now(timezone.utc) if progress_data.status == "completed" else None,
        )
        db.add(new_progress)
        db.commit()
        db.refresh(new_progress)
        return new_progress

# ==================== ADMIN LOGIC & CONTENT CREATION ====================

ADMIN_BOOTSTRAP_SECRET = settings.ADMIN_BOOTSTRAP_SECRET

def require_admin(current_user: User = Depends(get_current_user)):
    """Blocks non-admins from accessing admin-only routes"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized. Admin privileges required.")
    return current_user

@app.post("/admin/bootstrap/{user_id}")
def bootstrap_admin(user_id: int, secret: str, db: Session = Depends(get_db)):
    if db.query(User).filter(User.is_admin == True).count() > 0:
        raise HTTPException(
            status_code=403,
            detail="An admin already exists. Ask an existing admin to promote you instead.",
        )
    if secret != ADMIN_BOOTSTRAP_SECRET:
        raise HTTPException(status_code=403, detail="Invalid bootstrap secret.")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    user.is_admin = True
    db.commit()
    return {"message": f"User {user.username} is now an Admin!"}

@app.post("/admin/promote-user/{user_id}")
def promote_user(user_id: int, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    user.is_admin = True
    db.commit()
    return {"message": f"User {user.username} is now an Admin!"}

@app.get("/admin/users", response_model=List[UserResponse])
def list_users(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    return db.query(User).order_by(User.username).all()

@app.get("/api/admin/devotions")
def list_all_devotions(admin: User = Depends(require_admin), db: Session = Depends(get_db), params: PaginationParams = Depends()):
    query = db.query(Devotion)
    total = query.count()
    items = query.order_by(Devotion.date.desc()).offset((params.page - 1) * params.page_size).limit(params.page_size).all()
    return PaginatedResponse(
        items=items,
        total=total,
        page=params.page,
        page_size=params.page_size,
        pages=(total + params.page_size - 1) // params.page_size,
    )

@app.post("/api/admin/devotions")
def create_devotion(data: DevotionCreate, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    try:
        devotion_date = datetime.strptime(data.date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")
    
    new_devotion = Devotion(
        title=data.title,
        date=devotion_date,
        bible_reference=data.bible_reference,
        content=data.content,
        author=data.author,
        is_published=data.is_published
    )
    db.add(new_devotion)
    db.commit()
    db.refresh(new_devotion)
    return new_devotion

@app.get("/api/admin/sermon-series")
def list_all_sermon_series(admin: User = Depends(require_admin), db: Session = Depends(get_db), params: PaginationParams = Depends()):
    query = db.query(SermonSeries)
    total = query.count()
    items = query.order_by(SermonSeries.start_date.desc()).offset((params.page - 1) * params.page_size).limit(params.page_size).all()
    return PaginatedResponse(
        items=items,
        total=total,
        page=params.page,
        page_size=params.page_size,
        pages=(total + params.page_size - 1) // params.page_size,
    )

@app.post("/api/admin/sermon-series")
def create_sermon_series(data: SermonSeriesCreate, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    new_series = SermonSeries(
        title=data.title,
        description=data.description,
        speaker_name=data.speaker_name,
        thumbnail_url=data.thumbnail_url,
        start_date=datetime.now(timezone.utc)
    )
    db.add(new_series)
    db.commit()
    db.refresh(new_series)
    return new_series

@app.post("/api/admin/sermon-series/{series_id}/sermons")
def create_sermon(series_id: int, data: SermonCreate, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    series = db.query(SermonSeries).filter(SermonSeries.id == series_id).first()
    if not series:
        raise HTTPException(status_code=404, detail="Sermon series not found.")
        
    new_sermon = Sermon(
        series_id=series_id,
        title=data.title,
        description=data.description,
        speaker_name=data.speaker_name,
        video_url=data.video_url,
        bible_passage=data.bible_passage,
        sermon_date=datetime.now(timezone.utc)
    )
    db.add(new_sermon)
    db.commit()
    db.refresh(new_sermon)
    return new_sermon

@app.get("/")
def read_root():
    return {"message": "CHRIST-LIKE Backend API is running!", "docs": "/docs"}

@app.get("/health")
def health_check():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}

# ==================== FACTS FOR FAITH ====================
@app.get("/api/facts")
def get_facts(db: Session = Depends(get_db), params: PaginationParams = Depends()):
    query = db.query(FactForFaith)
    total = query.count()
    items = query.order_by(FactForFaith.order_index).offset((params.page - 1) * params.page_size).limit(params.page_size).all()
    return PaginatedResponse(
        items=items,
        total=total,
        page=params.page,
        page_size=params.page_size,
        pages=(total + params.page_size - 1) // params.page_size,
    )

@app.post("/api/admin/facts")
def create_fact(data: FactCreate, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    new_fact = FactForFaith(
        title=data.title,
        category=data.category,
        content=data.content,
        bible_reference=data.bible_reference,
        difficulty_level=data.difficulty_level
    )
    db.add(new_fact)
    db.commit()
    db.refresh(new_fact)
    return new_fact

# ==================== PRAYER WALL (SECURE) ====================
@app.get("/api/prayer-requests")
def get_active_prayers(db: Session = Depends(get_db), params: PaginationParams = Depends()):
    query = db.query(PrayerRequest).filter(PrayerRequest.is_resolved == False)
    total = query.count()
    items = query.order_by(PrayerRequest.created_at.desc()).offset((params.page - 1) * params.page_size).limit(params.page_size).all()
    return PaginatedResponse(
        items=items,
        total=total,
        page=params.page,
        page_size=params.page_size,
        pages=(total + params.page_size - 1) // params.page_size,
    )

@app.post("/api/prayer-requests")
def create_prayer(data: PrayerRequestCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    new_prayer = PrayerRequest(
        user_id=current_user.id,
        content=data.content,
        is_anonymous=data.is_anonymous
    )
    db.add(new_prayer)
    db.commit()
    db.refresh(new_prayer)
    return new_prayer

@app.post("/api/prayer-requests/{prayer_id}/pray")
def pray_for_request(prayer_id: int, db: Session = Depends(get_db)):
    prayer = db.query(PrayerRequest).filter(PrayerRequest.id == prayer_id).first()
    if not prayer:
        raise HTTPException(status_code=404, detail="Prayer not found")
    prayer.prayed_count += 1
    db.commit()
    return {"prayed_count": prayer.prayed_count}

# ==================== ADMIN PRAYER MODERATION ====================
@app.get("/api/admin/prayer-requests")
def get_all_prayers(admin: User = Depends(require_admin), db: Session = Depends(get_db), params: PaginationParams = Depends()):
    query = db.query(PrayerRequest)
    total = query.count()
    items = query.order_by(PrayerRequest.created_at.desc()).offset((params.page - 1) * params.page_size).limit(params.page_size).all()
    return PaginatedResponse(
        items=items,
        total=total,
        page=params.page,
        page_size=params.page_size,
        pages=(total + params.page_size - 1) // params.page_size,
    )

@app.patch("/api/admin/prayer-requests/{prayer_id}/resolve")
def resolve_prayer(prayer_id: int, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    prayer = db.query(PrayerRequest).filter(PrayerRequest.id == prayer_id).first()
    if not prayer: raise HTTPException(status_code=404, detail="Not found")
    prayer.is_resolved = True
    db.commit()
    return {"message": "Marked as answered"}

@app.delete("/api/admin/prayer-requests/{prayer_id}")
def delete_prayer(prayer_id: int, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    prayer = db.query(PrayerRequest).filter(PrayerRequest.id == prayer_id).first()
    if not prayer: raise HTTPException(status_code=404, detail="Not found")
    db.delete(prayer)
    db.commit()
    return {"message": "Deleted"}

@app.get("/api/stats")
def get_platform_stats(db: Session = Depends(get_db)):
    return {
        "total_lessons": db.query(Lesson).count(),
        "total_categories": db.query(Category).count(),
        "total_sermons": db.query(Sermon).count(),
        "total_devotions": db.query(Devotion).filter(Devotion.is_published == True).count(),
    }

# ==================== USER SETTINGS & STREAKS ====================
@app.patch("/users/me")
def update_user_profile(
    data: UserUpdate, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    if data.email and data.email != current_user.email:
        exists = db.query(User).filter(User.email == data.email).first()
        if exists: raise HTTPException(status_code=400, detail="Email already taken")
        current_user.email = data.email
        
    if data.faith_journey_stage:
        current_user.faith_journey_stage = data.faith_journey_stage

    if data.show_on_leaderboard is not None:
        current_user.show_on_leaderboard = data.show_on_leaderboard

    if data.new_password:
        if not data.current_password or not verify_password(data.current_password, current_user.hashed_password):
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        current_user.hashed_password = get_password_hash(data.new_password)
        
    db.commit()
    db.refresh(current_user)
    return current_user

@app.post("/users/me/activity")
def log_daily_activity(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    today = datetime.now().date()
    last_active = current_user.last_active_date.date() if current_user.last_active_date else None
    
    if last_active == today:
        return {"streak": current_user.streak_count, "message": "Already logged today"}
        
    if last_active and (today - last_active).days == 1:
        current_user.streak_count += 1
    else:
        current_user.streak_count = 1
        
    current_user.last_active_date = datetime.now(timezone.utc)
    db.commit()
    return {"streak": current_user.streak_count, "message": "Activity logged!"}

# ==================== ADMIN USER MANAGEMENT & IMPERSONATION ====================
@app.get("/api/admin/users")
def admin_list_users(admin: User = Depends(require_admin), db: Session = Depends(get_db), params: PaginationParams = Depends()):
    query = db.query(User)
    total = query.count()
    users = query.order_by(User.created_at.desc()).offset((params.page - 1) * params.page_size).limit(params.page_size).all()
    return {"total_count": total, "users": users, "page": params.page, "page_size": params.page_size}

@app.post("/api/admin/impersonate/{user_id}")
def impersonate_user(user_id: int, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user: raise HTTPException(status_code=404, detail="User not found")
    
    token = create_access_token(data={"sub": target_user.email})
    return {"access_token": token, "token_type": "bearer"}

# ==================== CONTENT COMPLETION TRACKING ====================
@app.post("/api/devotions/{devotion_id}/complete")
def mark_devotion_complete(devotion_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    devotion = db.query(Devotion).filter(Devotion.id == devotion_id).first()
    if not devotion:
        raise HTTPException(status_code=404, detail="Devotion not found")

    completion = ContentCompletion(
        user_id=current_user.id,
        content_type="devotion",
        content_id=devotion_id,
    )
    db.add(completion)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
    return {"message": "Marked as read"}

@app.get("/api/devotions/{devotion_id}/stats")
def get_devotion_stats(devotion_id: int, db: Session = Depends(get_db)):
    count = db.query(ContentCompletion).filter(
        ContentCompletion.content_type == "devotion",
        ContentCompletion.content_id == devotion_id
    ).count()
    return {"completed_count": count}

@app.get("/users/me/completed-devotions")
def get_my_completed_devotions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.query(ContentCompletion.content_id).filter(
        ContentCompletion.user_id == current_user.id,
        ContentCompletion.content_type == "devotion"
    ).all()
    return {"completed_ids": [r[0] for r in rows]}

# ==================== LEADERBOARD (OPT-IN) ====================
@app.get("/api/leaderboard")
def get_leaderboard(db: Session = Depends(get_db), params: PaginationParams = Depends()):
    results = (
        db.query(
            User.username,
            User.streak_count,
            sql_func.count(ContentCompletion.id).label("total_completions")
        )
        .join(ContentCompletion, ContentCompletion.user_id == User.id)
        .filter(User.show_on_leaderboard == True)
        .group_by(User.id)
        .order_by(sql_func.count(ContentCompletion.id).desc(), User.streak_count.desc())
        .offset((params.page - 1) * params.page_size)
        .limit(params.page_size)
        .all()
    )
    items = [
        {
            "username": r.username,
            "streak_count": r.streak_count,
            "total_completions": r.total_completions,
        }
        for r in results
    ]
    return PaginatedResponse(
        items=items,
        total=len(items),
        page=params.page,
        page_size=params.page_size,
        pages=1,
    )

# ==================== PASSWORD RESET ENDPOINTS ====================

@app.post("/auth/forgot-password")
async def forgot_password(email: str, db: Session = Depends(get_db)):
    """Generate a reset token and email it to the user"""
    user = db.query(User).filter(User.email == email).first()
    
    # Security best practice: Always return the same message, even if the email doesn't exist
    if not user:
        return {"message": "If an account with that email exists, a reset link has been sent."}
    
    # Generate a secure random token and set it to expire in 1 hour
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
    
    user.reset_token = token
    user.reset_token_expires = expires_at
    db.commit()
    
    # Send the email
    try:
        await send_password_reset_email(user.email, token, user.username)
    except Exception as e:
        print(f"Failed to send email: {e}")
        
    return {"message": "If an account with that email exists, a reset link has been sent."}


@app.post("/auth/reset-password")
async def reset_password(
    token: str, 
    new_password: str, 
    db: Session = Depends(get_db)
):
    """Validate token and update the user's password"""
    # Find user with this token that hasn't expired yet
    user = db.query(User).filter(
        User.reset_token == token,
        User.reset_token_expires > datetime.now(timezone.utc)
    ).first()
    
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")
    
    # Update password and clear the token so it can't be used again
    user.hashed_password = get_password_hash(new_password)
    user.reset_token = None
    user.reset_token_expires = None
    db.commit()
    
    return {"message": "Password successfully reset. You can now log in."}

# ==================== COMMUNITY CHAT ====================
from jose import JWTError, jwt
from chat import CHAT_CONTENT_TYPES, utcnow_naive

def _serialize_chat_message(msg: ChatMessageModel, check_availability: bool = False, sender_name: Optional[str] = None) -> dict:
    """Shared serializer for live websocket frames and REST history,
    so both always agree on message id (client-side dedupe relies on it).

    `sender_name` avoids touching the lazy-loaded `sender` relationship on a
    detached instance (which raises DetachedInstanceError after expunge)."""
    if sender_name is None:
        state = sa_inspect(msg)
        # Only touch the relationship when it is already loaded or still bound
        # to a live session; a detached unloaded 'sender' would raise.
        if "sender" not in state.unloaded or object_session(msg) is not None:
            sender_name = msg.sender.username if msg.sender else None
    payload = {
        "type": "chat_message",
        "id": msg.id,
        "sender_id": msg.sender_id,
        "sender_name": sender_name,
        "content": msg.content,
        "content_type": msg.content_type,
        "file_id": msg.file_id,
        "file_url": f"/api/chat/files/{msg.file_id}" if msg.file_id else None,
        "file_name": msg.file_name,
        "file_size": msg.file_size,
        "file_content_type": msg.file_content_type,
        "timestamp": msg.created_at.isoformat() if msg.created_at else "",
    }
    if msg.file_id:
        payload["file_available"] = (
            (UPLOAD_DIR / msg.file_id).exists() if check_availability else True
        )
    else:
        payload["file_available"] = False
    return payload

@app.websocket("/ws/chat/{user_id}")
async def websocket_chat(websocket: WebSocket, user_id: int):
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4001)
        return
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            await websocket.close(code=4001)
            return
    except JWTError:
        await websocket.close(code=4001)
        return

    db = db_session()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user or user.id != user_id:
            await websocket.close(code=4003)
            return
        sender_name = user.username
    finally:
        db.close()

    ws_max, ws_window = parse_rate(settings.RATE_LIMIT_WS_MESSAGE)
    await manager.connect(user_id, websocket)
    try:
        await websocket.send_json({
            "type": "system",
            "content": "Connected to Community Chat",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
        while True:
            data = await websocket.receive_json()

            # Per-user flood control: the HTTP rate-limit middleware cannot
            # see messages once the socket is open.
            if not rate_limiter.is_allowed(
                f"ws:{user_id}:message", ws_max, ws_window
            ):
                await websocket.send_json({
                    "type": "error",
                    "code": "rate_limited",
                    "content": "You are sending too quickly. Please slow down.",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                })
                continue

            try:
                incoming = ChatMessageIn(**data)
            except Exception:
                await websocket.send_json({
                    "type": "error",
                    "code": "invalid_payload",
                    "content": "Malformed message.",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                })
                continue

            content = incoming.content
            if len(content) > settings.CHAT_MAX_MESSAGE_LENGTH:
                await websocket.send_json({
                    "type": "error",
                    "code": "message_too_long",
                    "content": f"Message too long (max {settings.CHAT_MAX_MESSAGE_LENGTH} characters).",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                })
                continue

            content_type = "file" if incoming.file_id else "text"
            if content_type not in CHAT_CONTENT_TYPES:
                continue
            if not content and content_type == "text":
                continue

            db = db_session()
            try:
                chat_file = None
                if content_type == "file":
                    chat_file = db.query(ChatFile).filter(
                        ChatFile.file_id == incoming.file_id
                    ).first()
                    if not chat_file or not (UPLOAD_DIR / chat_file.file_id).exists():
                        await websocket.send_json({
                            "type": "error",
                            "code": "file_unavailable",
                            "content": "That upload has expired. Please send the file again.",
                            "timestamp": datetime.now(timezone.utc).isoformat(),
                        })
                        continue
                    content = content[: settings.CHAT_MAX_MESSAGE_LENGTH]

                record = ChatMessageModel(
                    sender_id=user_id,
                    content=content,
                    content_type=content_type,
                    file_id=chat_file.file_id if chat_file else None,
                    file_name=chat_file.filename if chat_file else None,
                    file_size=chat_file.size if chat_file else None,
                    file_content_type=chat_file.content_type if chat_file else None,
                    created_at=utcnow_naive(),
                )
                db.add(record)
                db.commit()
                db.refresh(record, attribute_names=["sender"])  # eager, safe after expunge
                db.expunge(record)
            except Exception as exc:
                db.rollback()
                logger.error("chat_persist_failed", extra={"error": str(exc)})
                await websocket.send_json({
                    "type": "error",
                    "code": "storage_error",
                    "content": "Message could not be saved. Please try again.",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                })
                continue
            finally:
                db.close()

            message = _serialize_chat_message(record, sender_name=sender_name)
            # Fresh copy per recipient; the sender is excluded and then sent
            # its own copy explicitly, so no one gets a shared/mutated dict.
            await manager.broadcast(dict(message), exclude=user_id)
            await manager.send_to_user(user_id, dict(message))
    except WebSocketDisconnect:
        pass
    except Exception as exc:
        logger.warning("chat_socket_error", extra={"user_id": user_id, "error": str(exc)})
    finally:
        # Runs on *every* exit path, so no ghost "online" entries survive
        # an unexpected exception.
        await manager.disconnect(user_id, websocket)

@app.post("/api/chat/upload")
async def upload_chat_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    filename = file.filename or "upload"
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="File type not allowed")

    client = current_user.id  # per-user, not per-IP: NATs share IPs
    max_req, window = parse_rate(settings.RATE_LIMIT_CHAT_UPLOAD)
    if not rate_limiter.is_allowed(f"{client}:/api/chat/upload", max_req, window):
        raise HTTPException(status_code=429, detail="Too many uploads. Please try again later.")

    file_id = f"{uuid.uuid4().hex}{ext}"
    file_path = UPLOAD_DIR / file_id
    written = 0
    # Stream to disk in chunks so concurrent uploads can't exhaust memory.
    try:
        with open(file_path, "wb") as f:
            while chunk := await file.read(1024 * 1024):
                written += len(chunk)
                if written > settings.CHAT_MAX_FILE_SIZE:
                    raise HTTPException(status_code=400, detail="File too large")
                f.write(chunk)
    except HTTPException:
        file_path.unlink(missing_ok=True)
        raise
    except OSError:
        file_path.unlink(missing_ok=True)
        raise HTTPException(status_code=500, detail="Storage error")

    if written == 0:
        file_path.unlink(missing_ok=True)
        raise HTTPException(status_code=400, detail="File is empty")

    expires_at = utcnow_naive() + timedelta(seconds=settings.CHAT_TTL_SECONDS)
    db = db_session()
    try:
        db.add(ChatFile(
            file_id=file_id,
            owner_id=current_user.id,
            filename=filename[:255],
            size=written,
            content_type=file.content_type or "application/octet-stream",
            expires_at=expires_at,
        ))
        db.commit()
    except Exception:
        db.rollback()
        file_path.unlink(missing_ok=True)
        raise HTTPException(status_code=500, detail="Could not register file")
    finally:
        db.close()

    return {
        "file_id": file_id,
        "file_url": f"/api/chat/files/{file_id}",
        "filename": filename,
        "size": written,
        "content_type": file.content_type,
        "expires_at": expires_at.isoformat(),
    }

@app.get("/api/chat/files/{file_id}")
async def download_chat_file(file_id: str, current_user: User = Depends(get_current_user)):
    # file_id is generated server-side (uuid + whitelisted extension), so it
    # can never escape UPLOAD_DIR. Never trust a client-supplied name here.
    db = db_session()
    try:
        meta = db.query(ChatFile).filter(ChatFile.file_id == file_id).first()
    finally:
        db.close()

    if not meta or is_expired(meta.expires_at):
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="File not found or expired")

    file_path = UPLOAD_DIR / file_id
    if not file_path.exists():
        raise HTTPException(status_code=410, detail="This file is no longer available")

    # A public group room means every member may open shared files; ownership
    # is recorded for audit/moderation rather than used as a read gate.
    # FileResponse(filename=...) already sets Content-Disposition -- do not
    # also pass a manual header, which would send the header twice.
    return FileResponse(
        path=str(file_path),
        filename=meta.filename,
        media_type=meta.content_type,
    )

@app.get("/api/chat/history")
async def get_chat_history(
    limit: int = settings.CHAT_HISTORY_LIMIT,
    before: Optional[str] = None,
    current_user: User = Depends(get_current_user),
):
    """Most recent messages, newest-first query returned chronologically.
    `before` is a created_at isoformat cursor for scrolling back."""
    limit = max(1, min(limit, 200))
    db = db_session()
    try:
        query = db.query(ChatMessageModel).options(
            selectinload(ChatMessageModel.sender)
        )
        if before:
            try:
                cursor = datetime.fromisoformat(before.replace("Z", "+00:00"))
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid 'before' cursor")
            query = query.filter(ChatMessageModel.created_at < cursor)
        rows = query.order_by(desc(ChatMessageModel.created_at)).limit(limit).all()
    finally:
        db.close()

    items = [_serialize_chat_message(r, check_availability=True) for r in reversed(rows)]
    return {
        "messages": items,
        "has_more": len(rows) == limit,
        "next_cursor": rows[-1].created_at.isoformat() if rows else None,
    }

@app.get("/api/chat/online")
async def get_online_users(current_user: User = Depends(get_current_user)):
    db = db_session()
    try:
        online = (
            db.query(User)
            .filter(User.id.in_(list(active_connections.keys())))
            .all()
        )
        return {
            "online": [
                {"user_id": u.id, "username": u.username, "is_admin": bool(u.is_admin)}
                for u in online
            ]
        }
    finally:
        db.close()