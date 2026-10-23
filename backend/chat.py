import logging
import asyncio
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable, Dict, Optional

from fastapi import WebSocket
from sqlalchemy.orm import Session

from config import settings
from models import ChatFile

logger = logging.getLogger("christlike.chat")

UPLOAD_DIR = Path(settings.CHAT_UPLOAD_DIR)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Single-worker in-process state. With more than one worker/container,
# connections land on different processes and only DB-persisted history
# is shared — a Redis pub/sub layer would be required for true fan-out.
active_connections: Dict[int, WebSocket] = {}
user_connection_times: Dict[int, datetime] = {}

ALLOWED_EXTENSIONS = {
    ".jpg", ".jpeg", ".png", ".gif", ".webp",
    ".mp4", ".mov", ".avi", ".webm",
    ".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx",
    ".mp3", ".wav", ".ogg",
    ".txt", ".md", ".json",
}

CHAT_CONTENT_TYPES = {"text", "file"}

# SQLite (tests) returns naive datetimes while Postgres returns aware ones,
# so always compare against a naive UTC wall clock.
def utcnow_naive() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)

def to_naive(dt: datetime) -> datetime:
    return dt.replace(tzinfo=None) if dt.tzinfo else dt

def is_expired(expires_at: Optional[datetime], now: Optional[datetime] = None) -> bool:
    if expires_at is None:
        return False
    return to_naive(expires_at) <= (now or utcnow_naive())

async def cleanup_expired_files(session_factory: Optional[Callable[[], Session]] = None, stop_event: Optional[asyncio.Event] = None):
    """Delete expired chat payloads from disk, then drop their registry rows.
    The DB is the source of truth, so files survive process restarts as long
    as the disk does; a missing payload is reported as expired on download.

    `session_factory` and `stop_event` are injected by the app lifespan so
    this stays testable (tests swap in their own engine/sessionmaker)."""
    if session_factory is None:
        from database import SessionLocal
        session_factory = SessionLocal
    while True:
        try:
            now = utcnow_naive()
            db = session_factory()
            try:
                expired = [
                    f for f in db.query(ChatFile).filter(ChatFile.expires_at.isnot(None)).all()
                    if is_expired(f.expires_at, now)
                ]
                for f in expired:
                    path = UPLOAD_DIR / f.file_id
                    try:
                        if path.exists():
                            path.unlink()
                    except OSError:
                        logger.warning("expired_file_delete_failed", extra={"file_id": f.file_id})
                    db.delete(f)
                db.commit()
            finally:
                db.close()
        except Exception as exc:
            logger.error("cleanup_failed", extra={"error": str(exc)})
        # Wait between sweeps, but wake immediately when the app shuts down.
        if stop_event:
            if stop_event.is_set():
                return
            try:
                await asyncio.wait_for(stop_event.wait(), timeout=settings.CHAT_CLEANUP_INTERVAL_SECONDS)
            except asyncio.TimeoutError:
                pass
        else:
            await asyncio.sleep(settings.CHAT_CLEANUP_INTERVAL_SECONDS)

class ConnectionManager:
    def __init__(self):
        self._lock = asyncio.Lock()

    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        async with self._lock:
            old = active_connections.get(user_id)
            active_connections[user_id] = websocket
            user_connection_times[user_id] = datetime.now(timezone.utc)
        # Close the previous socket outside the lock so a hung close
        # cannot block other connections.
        if old is not None and old is not websocket:
            try:
                await old.close(code=4009)
            except Exception:
                pass

    async def disconnect(self, user_id: int, websocket: Optional[WebSocket] = None):
        """Drop the connection. If a websocket is given, only remove the
        entry when it still points at that socket (prevents a stale handler
        from evicting a newer connection for the same user)."""
        async with self._lock:
            current = active_connections.get(user_id)
            if websocket is not None and current is not None and current is not websocket:
                return
            active_connections.pop(user_id, None)
            user_connection_times.pop(user_id, None)

    async def send_to_user(self, user_id: int, message: dict):
        ws = active_connections.get(user_id)
        if ws:
            try:
                await ws.send_json(message)
            except Exception:
                await self.disconnect(user_id, ws)

    async def broadcast(self, message: dict, exclude: Optional[int] = None):
        for uid, ws in list(active_connections.items()):
            if uid == exclude:
                continue
            try:
                await ws.send_json(message)
            except Exception:
                await self.disconnect(uid, ws)

    def is_online(self, user_id: int) -> bool:
        return user_id in active_connections

manager = ConnectionManager()
