# backend/main.py
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func as sql_func
from models import User, UserNote 
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import os
import httpx
from typing import List
from database import engine, get_db, Base
from models import (
    BibleBook, BibleChapter, BibleVerse, 
    Category, Lesson, SermonSeries, Sermon,
    Devotion, FactForFaith, PrayerRequest,
    User, UserProgress, ContentCompletion  # 👈 ADDED ContentCompletion
)
from schemas import (
    UserCreate, UserLogin, Token, UserResponse,
    DevotionCreate, SermonSeriesCreate, SermonCreate,
    FactCreate, PrayerRequestCreate, UserUpdate  # <--- ADD THIS
)
from auth import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_current_user,
)

# Create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="JOAPP Clone API")

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Your local Next.js frontend
        "http://localhost:3001",
       
        "https://christlike-app-1.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
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
        is_admin=user_in.email.lower() in ADMIN_EMAILS,   # 🆕
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
def create_note(data: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Create a new note"""
    new_note = UserNote(
        user_id=current_user.id,
        title=data.get("title", "Untitled Note"),
        note_text=data.get("note_text", ""),
        lesson_id=data.get("lesson_id"),
        verse_id=data.get("verse_id")
    )
    db.add(new_note)
    db.commit()
    db.refresh(new_note)
    return new_note

@app.patch("/api/notes/{note_id}")
def update_note(note_id: int, data: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Update an existing note"""
    note = db.query(UserNote).filter(UserNote.id == note_id, UserNote.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    if "title" in data:
        note.title = data["title"]
    if "note_text" in data:
        note.note_text = data["note_text"]
    
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
    return {"message": "Note deleted"}# ==================== CURRENT USER ENDPOINTS ====================


@app.get("/users/me", response_model=UserResponse)
def read_current_user(current_user: User = Depends(get_current_user)):
    """Get the currently authenticated user's profile"""
    return current_user

@app.get("/users/me/progress")
def read_current_user_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get the currently authenticated user's lesson progress"""
    progress = db.query(UserProgress).filter(UserProgress.user_id == current_user.id).all()
    return progress

# ==================== BIBLE API ENDPOINTS (bolls.life) ====================
BIBLE_TRANSLATION = "KJV"  # public domain, no API key required

@app.get("/api/bible/books")
async def get_bible_books():
    """Fetch the full list of Bible books (with chapter counts) from bolls.life"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"https://bolls.life/get-books/{BIBLE_TRANSLATION}/")
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="Failed to reach Bible API")

@app.get("/api/bible/chapter/{book_id}/{chapter}")
async def get_bible_chapter(book_id: int, chapter: int):
    """Fetch all verses for a specific book  or books + chapter from bolls.life"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://bolls.life/get-chapter/{BIBLE_TRANSLATION}/{book_id}/{chapter}/"
            )
            response.raise_for_status()
            data = response.json()
            if not data:
                raise HTTPException(status_code=404, detail="Chapter not found")
            return data
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="Failed to reach Bible API")

# ==================== CONTENT ENDPOINTS ====================
@app.get("/api/categories")
def get_categories(db: Session = Depends(get_db)):
    """Get all discipleship categories"""
    categories = db.query(Category).order_by(Category.order_index).all()
    return categories

@app.get("/api/categories/{category_id}/lessons")
def get_lessons(category_id: int, db: Session = Depends(get_db)):
    """Get all lessons in a category"""
    lessons = db.query(Lesson).filter(Lesson.category_id == category_id).all()
    return lessons

@app.get("/api/sermon-series")
def get_sermon_series(db: Session = Depends(get_db)):
    """Get all sermon series"""
    series = db.query(SermonSeries).filter(SermonSeries.is_active == True).all()
    return series

@app.get("/api/sermon-series/{series_id}/sermons")
def get_sermons(series_id: int, db: Session = Depends(get_db)):
    """Get all sermons in a series"""
    sermons = db.query(Sermon).filter(Sermon.series_id == series_id).order_by(Sermon.order_index).all()
    return sermons

@app.get("/api/devotions")
def get_devotions(db: Session = Depends(get_db)):
    """Get published devotions"""
    devotions = db.query(Devotion).filter(Devotion.is_published == True).all()
    return devotions

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
def get_facts_for_faith(db: Session = Depends(get_db)):
    """Get all facts for faith"""
    facts = db.query(FactForFaith).order_by(FactForFaith.order_index).all()
    return facts



# ==================== USER PROGRESS ENDPOINTS (by ID, unauthenticated) ====================
@app.get("/api/users/{user_id}/progress")
def get_user_progress(user_id: int, db: Session = Depends(get_db)):
    """Get user's progress across all lessons"""
    progress = db.query(UserProgress).filter(UserProgress.user_id == user_id).all()
    return progress

@app.post("/api/users/{user_id}/progress")
def update_progress(user_id: int, progress_data: dict, db: Session = Depends(get_db)):
    """Update user progress for a lesson"""
    existing = db.query(UserProgress).filter(
        UserProgress.user_id == user_id,
        UserProgress.lesson_id == progress_data["lesson_id"]
    ).first()
    
    if existing:
        existing.status = progress_data.get("status", existing.status)
        existing.progress_percentage = progress_data.get("progress_percentage", existing.progress_percentage)
        db.commit()
        return existing
    else:
        new_progress = UserProgress(
            user_id=user_id,
            lesson_id=progress_data["lesson_id"],
            status=progress_data.get("status", "in_progress"),
            progress_percentage=progress_data.get("progress_percentage", 0)
        )
        db.add(new_progress)
        db.commit()
        db.refresh(new_progress)
        return new_progress

# ==================== ADMIN LOGIC & CONTENT CREATION ====================


# Bootstrap secret comes from an environment variable in production — falls
# back to a dev-only default so local testing still works out of the box.
# ==================== ADMIN LOGIC & CONTENT CREATION ====================

ADMIN_BOOTSTRAP_SECRET = os.environ.get("ADMIN_BOOTSTRAP_SECRET", "JOAPP-MASTER-KEY-2026")

ADMIN_EMAILS_RAW = os.environ.get("ADMIN_EMAILS", "")
if ADMIN_EMAILS_RAW:
    ADMIN_EMAILS = {e.strip().lower() for e in ADMIN_EMAILS_RAW.split(",") if e.strip()}
else:
    DEFAULT_ADMINS = {"akjonan256@gmail.com"}
    ADMIN_EMAILS = DEFAULT_ADMINS

def require_admin(current_user: User = Depends(get_current_user)):
    """Blocks non-admins from accessing admin-only routes"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized. Admin privileges required.")
    return current_user

@app.post("/admin/bootstrap/{user_id}")
def bootstrap_admin(user_id: int, secret: str, db: Session = Depends(get_db)):
    """
    One-time bootstrap route. Only works if NO admin exists yet in the
    database — the moment one admin exists, this route always 403s, so the
    hardcoded/env secret stops being useful as an attack surface after
    initial setup. From then on, promotions must go through an authenticated
    admin using /admin/promote-user/{user_id}.
    """
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
    """Ongoing, production-safe way to promote someone: only an existing
    admin can call this, no secret required."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    user.is_admin = True
    db.commit()
    return {"message": f"User {user.username} is now an Admin!"}

@app.get("/admin/users", response_model=List[UserResponse])
def list_users(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    """List all users, so an admin can pick who to promote"""
    return db.query(User).order_by(User.username).all()

@app.get("/api/admin/devotions")
def list_all_devotions(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    """All devotions, including unpublished drafts — admin only"""
    return db.query(Devotion).order_by(Devotion.date.desc()).all()

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
def list_all_sermon_series(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    """All sermon series, including inactive ones — admin only"""
    return db.query(SermonSeries).order_by(SermonSeries.start_date.desc()).all()

@app.post("/api/admin/sermon-series")
def create_sermon_series(data: SermonSeriesCreate, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    new_series = SermonSeries(
        title=data.title,
        description=data.description,
        speaker_name=data.speaker_name,
        thumbnail_url=data.thumbnail_url,
        start_date=datetime.now()
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
        sermon_date=datetime.now()
    )
    db.add(new_sermon)
    db.commit()
    db.refresh(new_sermon)
    return new_sermon

@app.get("/")
def read_root():
    return {"message": "CHRIST-LIKE Backend API is running!", "docs": "/docs"}
# ==================== FACTS FOR FAITH ====================
@app.get("/api/facts")
def get_facts(db: Session = Depends(get_db)):
    """Public endpoint to get all facts"""
    return db.query(FactForFaith).order_by(FactForFaith.order_index).all()

@app.post("/api/admin/facts")
def create_fact(data: FactCreate, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    """Admin endpoint to create a new fact"""
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
def get_active_prayers(db: Session = Depends(get_db)):
    """Public endpoint to get active (unresolved) prayer requests"""
    return db.query(PrayerRequest).filter(PrayerRequest.is_resolved == False).order_by(PrayerRequest.created_at.desc()).all()

@app.post("/api/prayer-requests")
def create_prayer(data: PrayerRequestCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Authenticated users can post a prayer request"""
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
    """Anyone can click 'I prayed' to increment the counter"""
    prayer = db.query(PrayerRequest).filter(PrayerRequest.id == prayer_id).first()
    if not prayer:
        raise HTTPException(status_code=404, detail="Prayer not found")
    prayer.prayed_count += 1
    db.commit()
    return {"prayed_count": prayer.prayed_count}

# ==================== ADMIN PRAYER MODERATION ====================
@app.get("/api/admin/prayer-requests")
def get_all_prayers(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    """Admin can see all prayers, including resolved ones"""
    return db.query(PrayerRequest).order_by(PrayerRequest.created_at.desc()).all()

@app.patch("/api/admin/prayer-requests/{prayer_id}/resolve")
def resolve_prayer(prayer_id: int, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    """Admin marks a prayer as answered"""
    prayer = db.query(PrayerRequest).filter(PrayerRequest.id == prayer_id).first()
    if not prayer: raise HTTPException(status_code=404, detail="Not found")
    prayer.is_resolved = True
    db.commit()
    return {"message": "Marked as answered"}

@app.delete("/api/admin/prayer-requests/{prayer_id}")
def delete_prayer(prayer_id: int, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    """Admin can delete inappropriate prayers"""
    prayer = db.query(PrayerRequest).filter(PrayerRequest.id == prayer_id).first()
    if not prayer: raise HTTPException(status_code=404, detail="Not found")
    db.delete(prayer)
    db.commit()
    return {"message": "Deleted"}

@app.get("/api/stats")
def get_platform_stats(db: Session = Depends(get_db)):
    """Live counts, so the dashboard reflects real admin-posted content"""
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
    """Update profile, password, or faith stage"""
    if data.email and data.email != current_user.email:
        exists = db.query(User).filter(User.email == data.email).first()
        if exists: raise HTTPException(status_code=400, detail="Email already taken")
        current_user.email = data.email
        
    if data.faith_journey_stage:
        current_user.faith_journey_stage = data.faith_journey_stage

    if data.show_on_leaderboard is not None:  # 👈 ADDED: leaderboard opt-in toggle
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
    """Called when user reads devotion/bible to update their streak"""
    today = datetime.now().date()
    last_active = current_user.last_active_date.date() if current_user.last_active_date else None
    
    if last_active == today:
        return {"streak": current_user.streak_count, "message": "Already logged today"}
        
    if last_active and (today - last_active).days == 1:
        current_user.streak_count += 1  # Consecutive day!
    else:
        current_user.streak_count = 1   # Reset streak
        
    current_user.last_active_date = datetime.now()
    db.commit()
    return {"streak": current_user.streak_count, "message": "Activity logged!"}

# ==================== ADMIN USER MANAGEMENT & IMPERSONATION ====================
@app.get("/api/admin/users")
def admin_list_users(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    """Admin gets list of all users and total count"""
    users = db.query(User).order_by(User.created_at.desc()).all()
    return {"total_count": len(users), "users": users}

@app.post("/api/admin/impersonate/{user_id}")
def impersonate_user(user_id: int, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    """Admin generates a token to log in AS a specific user"""
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user: raise HTTPException(status_code=404, detail="User not found")
    
    # Generate a JWT for the target user
    token = create_access_token(data={"sub": target_user.email})
    return {"access_token": token, "token_type": "bearer"}

# ==================== CONTENT COMPLETION TRACKING (NEW) ====================

@app.post("/api/devotions/{devotion_id}/complete")
def mark_devotion_complete(devotion_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """User marks a devotion as read. Safe to call more than once — the
    unique constraint on ContentCompletion prevents duplicate rows."""
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
        db.rollback()  # already marked complete — no-op
    return {"message": "Marked as read"}

@app.get("/api/devotions/{devotion_id}/stats")
def get_devotion_stats(devotion_id: int, db: Session = Depends(get_db)):
    """Public, anonymous count of how many people have completed this devotion"""
    count = db.query(ContentCompletion).filter(
        ContentCompletion.content_type == "devotion",
        ContentCompletion.content_id == devotion_id
    ).count()
    return {"completed_count": count}

@app.get("/users/me/completed-devotions")
def get_my_completed_devotions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Which devotion IDs the current user has completed — used to show checkmarks"""
    rows = db.query(ContentCompletion.content_id).filter(
        ContentCompletion.user_id == current_user.id,
        ContentCompletion.content_type == "devotion"
    ).all()
    return {"completed_ids": [r[0] for r in rows]}

# ==================== LEADERBOARD (NEW, OPT-IN) ====================

@app.get("/api/leaderboard")
def get_leaderboard(db: Session = Depends(get_db)):
    """Ranks users who opted in (show_on_leaderboard=True) by total content
    completions, tie-broken by current streak. Users who haven't opted in
    never appear here."""
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
        .limit(20)
        .all()
    )
    return [
        {
            "username": r.username,
            "streak_count": r.streak_count,
            "total_completions": r.total_completions,
        }
        for r in results
    ]
