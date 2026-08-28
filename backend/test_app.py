import pytest
import os
import sys
import time
import asyncio
from datetime import datetime
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import Base, get_db
from main import app
from models import User, Devotion, Category
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
    rate_limiter._store.clear()
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
