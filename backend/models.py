# backend/models.py
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Float, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

# ==================== USER MODELS ====================
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    faith_journey_stage = Column(String(50))  # 'Seeker', 'New Believer', 'Growing', 'Mature'
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    streak_count = Column(Integer, default=0)
    last_active_date = Column(DateTime(timezone=True), nullable=True)
    show_on_leaderboard = Column(Boolean, default=False)  # 👈 ADDED: opt-in leaderboard visibility
    
    # Relationships
    progress = relationship("UserProgress", back_populates="user")
    notes = relationship("UserNote", back_populates="user")
    prayer_requests = relationship("PrayerRequest", back_populates="user")
    highlights = relationship("UserHighlight", back_populates="user")

# ==================== BIBLE MODELS ====================
class BibleBook(Base):
    __tablename__ = "bible_books"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)  # e.g., "Genesis", "John"
    testament = Column(String(10))  # "Old" or "New"
    chapters_count = Column(Integer)
    order_index = Column(Integer)  # 1-66
    
    chapters = relationship("BibleChapter", back_populates="book")

class BibleChapter(Base):
    __tablename__ = "bible_chapters"
    
    id = Column(Integer, primary_key=True, index=True)
    book_id = Column(Integer, ForeignKey("bible_books.id"))
    chapter_number = Column(Integer)
    
    book = relationship("BibleBook", back_populates="chapters")
    verses = relationship("BibleVerse", back_populates="chapter")

class BibleVerse(Base):
    __tablename__ = "bible_verses"
    
    id = Column(Integer, primary_key=True, index=True)
    chapter_id = Column(Integer, ForeignKey("bible_chapters.id"))
    verse_number = Column(Integer)
    text = Column(Text, nullable=False)
    translation = Column(String(20), default="WEB")  # World English Bible
    
    chapter = relationship("BibleChapter", back_populates="verses")
    highlights = relationship("UserHighlight", back_populates="verse")

# ==================== CONTENT CATEGORIES ====================
class Category(Base):
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)  # e.g., "Time with God", "Personal Growth"
    description = Column(Text)
    icon_url = Column(String(500))
    color = Column(String(20))  # Hex color for UI
    order_index = Column(Integer)
    
    lessons = relationship("Lesson", back_populates="category")

# ==================== LESSONS ====================
class Lesson(Base):
    __tablename__ = "lessons"
    
    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"))
    title = Column(String(255), nullable=False)
    content = Column(Text)
    bible_reference = Column(String(100))  # e.g., "John 3:16"
    order_index = Column(Integer)
    estimated_duration = Column(Integer)  # in minutes
    is_premium = Column(Boolean, default=False)
    
    category = relationship("Category", back_populates="lessons")

# ==================== SERMON SERIES ====================
class SermonSeries(Base):
    __tablename__ = "sermon_series"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    speaker_name = Column(String(255))
    thumbnail_url = Column(String(500))
    start_date = Column(DateTime)
    is_active = Column(Boolean, default=True)
    
    sermons = relationship("Sermon", back_populates="series")

class Sermon(Base):
    __tablename__ = "sermons"
    
    id = Column(Integer, primary_key=True, index=True)
    series_id = Column(Integer, ForeignKey("sermon_series.id"))
    title = Column(String(255), nullable=False)
    description = Column(Text)
    speaker_name = Column(String(255))
    sermon_date = Column(DateTime)
    bible_passage = Column(String(255))
    video_url = Column(String(500))  # YouTube, Vimeo, or custom video host
    duration_minutes = Column(Integer)
    order_index = Column(Integer)
    
    series = relationship("SermonSeries", back_populates="sermons")

# ==================== DEVOTIONS ====================
class Devotion(Base):
    __tablename__ = "devotions"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    date = Column(DateTime, index=True)  # Date for daily devotion
    bible_reference = Column(String(100))
    content = Column(Text, nullable=False)
    reflection_questions = Column(Text)  # JSON array of questions
    prayer = Column(Text)
    author = Column(String(255))
    is_published = Column(Boolean, default=False)

# ==================== FACTS FOR FAITH ====================
class FactForFaith(Base):
    __tablename__ = "facts_for_faith"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    category = Column(String(100))  # e.g., "Apologetics", "Bible Facts", "History"
    content = Column(Text, nullable=False)
    bible_reference = Column(String(100))
    difficulty_level = Column(String(20))  # "Beginner", "Intermediate", "Advanced"
    order_index = Column(Integer)

# ==================== PRAYER WALL ====================
class PrayerRequest(Base):
    __tablename__ = "prayer_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    content = Column(Text, nullable=False)
    is_anonymous = Column(Boolean, default=False)
    prayed_count = Column(Integer, default=0)
    is_resolved = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="prayer_requests")

# ==================== USER PROGRESS & ACTIVITY ====================
class UserProgress(Base):
    __tablename__ = "user_progress"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    lesson_id = Column(Integer, ForeignKey("lessons.id"))
    status = Column(String(20))  # "not_started", "in_progress", "completed"
    completed_at = Column(DateTime(timezone=True))
    progress_percentage = Column(Integer, default=0)
    
    user = relationship("User", back_populates="progress")

class UserHighlight(Base):
    __tablename__ = "user_highlights"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    verse_id = Column(Integer, ForeignKey("bible_verses.id"))
    highlight_text = Column(Text)
    color = Column(String(20))  # Highlight color
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="highlights")
    verse = relationship("BibleVerse", back_populates="highlights")

class UserNote(Base):
    __tablename__ = "user_notes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String(255), default="Untitled Note")  # 👈 ADD THIS LINE
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=True)
    verse_id = Column(Integer, ForeignKey("bible_verses.id"), nullable=True)
    note_text = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    user = relationship("User", back_populates="notes")

# ==================== CONTENT COMPLETION TRACKING (NEW) ====================
class ContentCompletion(Base):
    """Tracks when a user marks a piece of content (devotion, sermon, fact)
    as read/watched/completed. content_type + content_id lets this cover
    multiple content kinds without needing a separate table for each."""
    __tablename__ = "content_completions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content_type = Column(String(50), nullable=False)  # "devotion", "sermon", "fact"
    content_id = Column(Integer, nullable=False)
    completed_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint('user_id', 'content_type', 'content_id', name='_user_content_uc'),
    )