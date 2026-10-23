import time
import threading
from fastapi import HTTPException, status, Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from collections import defaultdict
from config import settings

class RateLimiter:
    def __init__(self):
        self._store = defaultdict(list)
        self._lock = threading.Lock()
        self._calls = 0

    def is_allowed(self, key: str, max_requests: int, window_seconds: int) -> bool:
        now = time.time()
        with self._lock:
            self._calls += 1
            # Periodic sweep: keys are per client/route (and now per chat user),
            # so without pruning the store grows without bound.
            if self._calls % 1000 == 0:
                horizon = now - 3600
                self._store = defaultdict(list, {
                    k: v for k, v in self._store.items()
                    if v and v[-1] > horizon
                })
            timestamps = [t for t in self._store[key] if t > now - window_seconds]
            self._store[key] = timestamps
            if len(timestamps) >= max_requests:
                return False
            self._store[key].append(now)
            return True

rate_limiter = RateLimiter()

def parse_rate(rate_str: str) -> tuple[int, int]:
    parts = rate_str.strip().split("/")
    if len(parts) != 2:
        return 100, 60
    count = int(parts[0])
    window = 60 if parts[1].strip().lower() in ("minute", "min") else 1
    return count, window

class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        if path.startswith("/docs") or path.startswith("/redoc") or path.startswith("/openapi.json"):
            return await call_next(request)

        client = request.client.host if request.client else "unknown"
        route_key = f"{client}:{path}"

        if path == "/auth/login":
            max_req, window = parse_rate(settings.RATE_LIMIT_LOGIN)
        elif path == "/auth/register":
            max_req, window = parse_rate(settings.RATE_LIMIT_REGISTER)
        else:
            max_req, window = parse_rate(settings.RATE_LIMIT_API)

        if not rate_limiter.is_allowed(route_key, max_req, window):
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={"detail": "Too many requests. Please try again later."},
            )

        return await call_next(request)
