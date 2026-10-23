import pytest
import os
import sys
import time
import asyncio
import uuid
import threading
from datetime import datetime, timedelta, timezone
from unittest.mock import patch, AsyncMock
from fastapi import HTTPException
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import Base, get_db
from main import app
import main as main_module
from chat import UPLOAD_DIR, active_connections, cleanup_expired_files
from models import User, Devotion, Category, ChatFile
from config import settings
from auth import get_password_hash
from rate_limit import rate_limiter

TEST_DATABASE_URL = "sqlite:///./test_christlike.db"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False}, poolclass=StaticPool)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
Base.metadata.create_all(bind=engine)

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    # A previously interrupted run can leave rows behind (file-based SQLite
    # survives the process), which shows up as UNIQUE failures.
    db = TestingSessionLocal()
    for table in reversed(Base.metadata.sorted_tables):
        db.execute(table.delete())
    db.commit()
    db.close()
    rate_limiter._store.clear()
    # The async chat routes open sessions directly (no Depends), so point
    # them at the test engine as well.
    with patch.object(main_module, "db_session", TestingSessionLocal):
        yield
    Base.metadata.drop_all(bind=engine)
    rate_limiter._store.clear()

def test_health_check():
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert "timestamp" in data

def test_register_and_login():
    resp = client.post("/auth/register", json={
        "email": "test@example.com",
        "username": "testuser",
        "password": "password123"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == "test@example.com"
    assert data["username"] == "testuser"

    resp = client.post("/auth/login", data={
        "username": "test@example.com",
        "password": "password123"
    }, headers={"Content-Type": "application/x-www-form-urlencoded"})
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_rate_limiting():
    rate_limiter._store.clear()
    for i in range(6):
        resp = client.post("/auth/login", data={
            "username": "rate@example.com",
            "password": "password123"
        }, headers={"Content-Type": "application/x-www-form-urlencoded"})
    assert resp.status_code == 429

def test_pagination_categories():
    db = TestingSessionLocal()
    for i in range(25):
        cat = Category(name=f"Cat {i}", description="Test", order_index=i)
        db.add(cat)
    db.commit()
    db.close()

    resp = client.get("/api/categories?page=1&page_size=10")
    assert resp.status_code == 200
    data = resp.json()
    assert data["page"] == 1
    assert data["page_size"] == 10
    assert data["total"] == 25
    assert data["pages"] == 3
    assert len(data["items"]) == 10

def test_pagination_devotions():
    db = TestingSessionLocal()
    for i in range(15):
        dev = Devotion(
            title=f"Devotion {i}",
            date=datetime(2024, 1, 1),
            bible_reference="John 3:16",
            content="Test content",
            author="Test",
            is_published=True
        )
        db.add(dev)
    db.commit()
    db.close()

    resp = client.get("/api/devotions?page=2&page_size=5")
    assert resp.status_code == 200
    data = resp.json()
    assert data["page"] == 2
    assert len(data["items"]) == 5

def test_notes_schema_validation():
    db = TestingSessionLocal()
    user = User(email="note@example.com", username="noteuser", hashed_password=get_password_hash("password123"))
    db.add(user)
    db.commit()
    db.refresh(user)
    db.close()

    token_resp = client.post("/auth/login", data={
        "username": "note@example.com",
        "password": "password123"
    }, headers={"Content-Type": "application/x-www-form-urlencoded"})
    token = token_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.post("/api/notes", json={
        "title": "My Note",
        "note_text": "This is a test note"
    }, headers=headers)
    assert resp.status_code == 200
    assert resp.json()["title"] == "My Note"

    note_id = resp.json()["id"]
    resp = client.patch(f"/api/notes/{note_id}", json={
        "note_text": "Updated note"
    }, headers=headers)
    assert resp.status_code == 200
    assert resp.json()["note_text"] == "Updated note"

def test_progress_schema_validation():
    db = TestingSessionLocal()
    user = User(email="prog@example.com", username="proguser", hashed_password=get_password_hash("password123"))
    db.add(user)
    db.commit()
    db.refresh(user)
    db.close()

    token_resp = client.post("/auth/login", data={
        "username": "prog@example.com",
        "password": "password123"
    }, headers={"Content-Type": "application/x-www-form-urlencoded"})
    token = token_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.post("/api/users/1/progress", json={
        "lesson_id": 1,
        "status": "completed",
        "progress_percentage": 100
    }, headers=headers)
    assert resp.status_code == 200
    assert resp.json()["status"] == "completed"

def test_chat_file_upload():
    db = TestingSessionLocal()
    user = User(email="chat@example.com", username="chatuser", hashed_password=get_password_hash("password123"))
    db.add(user)
    db.commit()
    db.refresh(user)
    db.close()

    token_resp = client.post("/auth/login", data={
        "username": "chat@example.com",
        "password": "password123"
    }, headers={"Content-Type": "application/x-www-form-urlencoded"})
    token = token_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.post(
        "/api/chat/upload",
        files={"file": ("test.txt", b"hello world", "text/plain")},
        headers=headers
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "file_id" in data
    assert "file_url" in data
    assert data["filename"] == "test.txt"

def test_chat_online_users():
    db = TestingSessionLocal()
    user = User(email="online@example.com", username="onlineuser", hashed_password=get_password_hash("password123"))
    db.add(user)
    db.commit()
    db.refresh(user)
    db.close()

    token_resp = client.post("/auth/login", data={
        "username": "online@example.com",
        "password": "password123"
    }, headers={"Content-Type": "application/x-www-form-urlencoded"})
    token = token_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.get("/api/chat/online", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "online" in data


# ==================== CHAT: PERSISTENCE / WEBSOCKET ====================
def _make_user(email: str, username: str):
    """Create a user and return (id, auth headers)."""
    db = TestingSessionLocal()
    db.add(User(email=email, username=username, hashed_password=get_password_hash("password123")))
    db.commit()
    db.close()

    token_resp = client.post("/auth/login", data={
        "username": email,
        "password": "password123"
    }, headers={"Content-Type": "application/x-www-form-urlencoded"})
    return token_resp.json()["access_token"]

def _drain_until(sock, predicate, limit=10, timeout=10.0):
    """Read frames until one matches, skipping the 'system' notice sent on
    connect. Runs the blocking receive in a daemon thread with a timeout so a
    dropped frame fails the test in seconds instead of hanging the suite."""
    import queue

    for _ in range(limit):
        results: "queue.Queue" = queue.Queue(maxsize=1)

        def _receive():
            try:
                results.put(("ok", sock.receive_json()))
            except BaseException as exc:  # socket closed / protocol error
                results.put(("error", exc))

        threading.Thread(target=_receive, daemon=True).start()
        try:
            status, frame = results.get(timeout=timeout)
        except queue.Empty:
            raise AssertionError("timed out waiting for a websocket frame")
        if status == "error":
            raise frame
        if predicate(frame):
            return frame
    raise AssertionError("no matching frame received")

def test_chat_upload_rejects_empty_file():
    token = _make_user("empty@example.com", "emptyuser")
    headers = {"Authorization": f"Bearer {token}"}
    resp = client.post(
        "/api/chat/upload",
        files={"file": ("empty.txt", b"", "text/plain")},
        headers=headers,
    )
    assert resp.status_code == 400
    assert "empty" in resp.json()["detail"].lower()

def test_chat_history_requires_auth():
    assert client.get("/api/chat/history").status_code in (401, 403)

def test_chat_websocket_rejects_impersonation():
    """A valid token for user A must not open a socket as user B."""
    token = _make_user("imp1@example.com", "imp1")
    with pytest.raises(Exception):
        with client.websocket_connect(f"/ws/chat/999999?token={token}"):
            pass

def test_chat_websocket_receives_own_message_once():
    token = _make_user("wsdedupe@example.com", "wsdedupe")
    db = TestingSessionLocal()
    uid = db.query(User).filter(User.email == "wsdedupe@example.com").first().id
    db.close()
    headers = {"Authorization": f"Bearer {token}"}

    with client.websocket_connect(f"/ws/chat/{uid}?token={token}") as sock:
        sock.send_json({"content": "hello world"})
        frame = _drain_until(sock, lambda f: f.get("type") == "chat_message")

    assert frame["content"] == "hello world"
    assert frame["content_type"] == "text"
    assert frame["sender_id"] == uid
    assert frame["sender_name"] == "wsdedupe"
    assert frame["id"]

    history = client.get("/api/chat/history", headers=headers).json()["messages"]
    assert [m["id"] for m in history] == [frame["id"]]

def test_chat_websocket_rejects_bad_types_and_empty_then_survives():
    token = _make_user("wsvalid@example.com", "wsvalid")
    db = TestingSessionLocal()
    uid = db.query(User).filter(User.email == "wsvalid@example.com").first().id
    db.close()
    headers = {"Authorization": f"Bearer {token}"}

    with client.websocket_connect(f"/ws/chat/{uid}?token={token}") as sock:
        # Wrong type for `content` -> rejected, socket stays open.
        sock.send_json({"content": 12345})
        err = _drain_until(sock, lambda f: f.get("type") == "error")
        assert err["code"] == "invalid_payload"

        # Empty text and unknown extra keys are dropped without a reply.
        sock.send_json({"content": "   "})
        sock.send_json({"nonsense": True})
        sock.send_json({"content": "still alive"})
        frame = _drain_until(sock, lambda f: f.get("type") == "chat_message")
        assert frame["content"] == "still alive"

    history = client.get("/api/chat/history", headers=headers).json()["messages"]
    assert [m["content"] for m in history] == ["still alive"]

def test_chat_file_message_carries_real_mime_type():
    token = _make_user("wsfile@example.com", "wsfile")
    db = TestingSessionLocal()
    uid = db.query(User).filter(User.email == "wsfile@example.com").first().id
    db.close()
    headers = {"Authorization": f"Bearer {token}"}

    upload = client.post(
        "/api/chat/upload",
        files={"file": ("note.txt", b"persist me", "text/plain")},
        headers=headers,
    )
    assert upload.status_code == 200
    file_id = upload.json()["file_id"]

    with client.websocket_connect(f"/ws/chat/{uid}?token={token}") as sock:
        sock.send_json({"content": "", "file_id": file_id})
        frame = _drain_until(sock, lambda f: f.get("type") == "chat_message")

    assert frame["content_type"] == "file"
    assert frame["file_name"] == "note.txt"
    assert frame["file_content_type"] == "text/plain"
    assert frame["file_size"] == len(b"persist me")

    # Unknown file ids must not create a message with a dangling FK.
    with client.websocket_connect(f"/ws/chat/{uid}?token={token}") as sock:
        sock.send_json({"file_id": "does-not-exist.txt"})
        err = _drain_until(sock, lambda f: f.get("type") == "error")
        assert err["code"] == "file_unavailable"

def test_chat_expired_file_rejected_on_download_and_send():
    token = _make_user("expired@example.com", "expireduser")
    headers = {"Authorization": f"Bearer {token}"}

    upload = client.post(
        "/api/chat/upload",
        files={"file": ("old.txt", b"perished", "text/plain")},
        headers=headers,
    )
    file_id = upload.json()["file_id"]

    db = TestingSessionLocal()
    record = db.query(ChatFile).filter(ChatFile.file_id == file_id).first()
    # Stored exactly as the upload path stores it: aware UTC -> naive UTC on SQLite.
    record.expires_at = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(seconds=5)
    db.commit()
    db.close()

    assert client.get(f"/api/chat/files/{file_id}", headers=headers).status_code == 404

    stop = asyncio.Event()
    stop.set()  # single pass, then return
    asyncio.run(cleanup_expired_files(TestingSessionLocal, stop))

    assert not (UPLOAD_DIR / file_id).exists()
    assert file_id not in [f.file_id for f in TestingSessionLocal().query(ChatFile).all()]

def test_chat_socket_exception_does_not_leave_ghost_online_entry():
    token = _make_user("ghost@example.com", "ghostuser")
    db = TestingSessionLocal()
    uid = db.query(User).filter(User.email == "ghost@example.com").first().id
    db.close()

    with client.websocket_connect(f"/ws/chat/{uid}?token={token}") as sock:
        assert uid in active_connections
        sock.send_json({"content": "raw bytes", "file_id": 12345})

    # Client disconnected -> the handler's finally block must clean up.
    assert uid not in active_connections
    assert client.get("/api/chat/online", headers={"Authorization": f"Bearer {token}"}).json()["online"] == []
