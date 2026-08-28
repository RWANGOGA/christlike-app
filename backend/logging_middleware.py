import logging
import time
import uuid
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

logger = logging.getLogger("christlike")
logger.setLevel(logging.INFO)

if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter(
        '{"time":"%(asctime)s","level":"%(levelname)s","request_id":"%(request_id)s","method":"%(method)s","path":"%(path)s","status":"%(status)s","duration_ms":"%(duration_ms)s","log_message":"%(log_message)s"}'
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())
        start = time.time()
        request.state.request_id = request_id

        try:
            response = await call_next(request)
            duration = int((time.time() - start) * 1000)
            logger.info(
                "request_handled",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "status": response.status_code,
                    "duration_ms": duration,
                    "log_message": "ok",
                },
            )
            response.headers["X-Request-ID"] = request_id
            return response
        except Exception as exc:
            duration = int((time.time() - start) * 1000)
            logger.error(
                "request_failed",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "status": "500",
                    "duration_ms": duration,
                    "log_message": str(exc),
                },
            )
            raise
