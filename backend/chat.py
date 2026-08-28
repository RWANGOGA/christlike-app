import os
import uuid
import time
import logging
import asyncio
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, Optional, Set
from collections import defaultdict

import httpx
from fastapi import WebSocket, WebSocketDisconnect, UploadFile, File, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from starlette.status import HTTP_404_NOT_FOUND

from config import settings

logger = logging.getLogger("christlike.chat")

UPLOAD_DIR = Path(settings.CHAT_UPLOAD_DIR)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

active_connections: Dict[int, WebSocket] = {}
user_languages: Dict[int, str] = {}
user_connection_times: Dict[int, datetime] = {}

file_registry: Dict[str, Dict] = {}
file_lock = asyncio.Lock()

ALLOWED_EXTENSIONS = {
    ".jpg", ".jpeg", ".png", ".gif", ".webp",
    ".mp4", ".mov", ".avi", ".webm",
    ".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx",
    ".mp3", ".wav", ".ogg",
    ".txt", ".md", ".json",
}

class TranslationService:
    @staticmethod
    async def translate(text: str, target_language: str, source_language: str = "auto") -> str:
        if not target_language or target_language.lower() in ("en", "english"):
            return text
        api_url = settings.TRANSLATION_API_URL.strip()
        if not api_url:
            return text
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.post(
                    api_url,
                    json={
                        "q": text,
                        "source": source_language,
                        "target": target_language,
                        "format": "text",
                    },
                    headers={"Content-Type": "application/json"},
                )
                resp.raise_for_status()
                data = resp.json()
                return data.get("translatedText", text)
        except Exception as exc:
            logger.warning("translation_failed", extra={"error": str(exc)})
            return text

translation_service = TranslationService()

async def cleanup_expired_files():
    while True:
        now = time.time()
        expired = []
        async with file_lock:
            for file_id, meta in list(file_registry.items()):
                if now - meta["created_at"] > settings.CHAT_TTL_SECONDS:
                    expired.append(file_id)
        for file_id in expired:
            path = UPLOAD_DIR / file_id
            try:
                if path.exists():
                    path.unlink()
            except OSError:
                pass
            async with file_lock:
                file_registry.pop(file_id, None)
        await asyncio.sleep(60)

class ConnectionManager:
    def __init__(self):
        self._lock = asyncio.Lock()

    async def connect(self, user_id: int, websocket: WebSocket, language: str = "en"):
        await websocket.accept()
        async with self._lock:
            if user_id in active_connections:
                try:
                    await active_connections[user_id].close()
                except Exception:
                    pass
            active_connections[user_id] = websocket
            user_languages[user_id] = language or "en"
            user_connection_times[user_id] = datetime.utcnow()

    async def disconnect(self, user_id: int):
        async with self._lock:
            active_connections.pop(user_id, None)
            user_languages.pop(user_id, None)
            user_connection_times.pop(user_id, None)

    async def send_to_user(self, user_id: int, message: dict):
        ws = active_connections.get(user_id)
        if ws:
            try:
                await ws.send_json(message)
            except Exception:
                await self.disconnect(user_id)

    async def broadcast(self, message: dict, exclude: Optional[int] = None):
        for uid, ws in list(active_connections.items()):
            if uid == exclude:
                continue
            try:
                await ws.send_json(message)
            except Exception:
                await self.disconnect(uid)

    def get_language(self, user_id: int) -> str:
        return user_languages.get(user_id, "en")

    def is_online(self, user_id: int) -> bool:
        return user_id in active_connections

manager = ConnectionManager()
