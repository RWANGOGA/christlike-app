from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str = "postgresql+psycopg://joapp_user:secure_password@db:5432/joapp_db"
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    ADMIN_EMAILS: str = ""
    ADMIN_BOOTSTRAP_SECRET: str = "JOAPP-MASTER-KEY-2026"

    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:3001,https://christlike-app-1.onrender.com"

    RATE_LIMIT_LOGIN: str = "5/minute"
    RATE_LIMIT_REGISTER: str = "3/minute"
    RATE_LIMIT_API: str = "100/minute"
    RATE_LIMIT_CHAT_UPLOAD: str = "20/minute"
    RATE_LIMIT_WS_MESSAGE: str = "30/minute"

    MAIL_USERNAME: str = ""
    MAIL_PASSWORD: str = ""
    MAIL_FROM: str = ""
    MAIL_PORT: int = 587
    MAIL_SERVER: str = ""
    MAIL_STARTTLS: bool = True
    MAIL_SSL_TLS: bool = False
    FRONTEND_URL: str = "http://localhost:3001"

    BREVO_API_KEY: str = ""

    CHAT_UPLOAD_DIR: str = "/tmp/chat_uploads"
    CHAT_MAX_FILE_SIZE: int = 50 * 1024 * 1024  # 50MB
    CHAT_TTL_SECONDS: int = 30 * 24 * 3600  # keep uploaded files 30 days
    CHAT_CLEANUP_INTERVAL_SECONDS: int = 3600  # sweep expired files hourly
    CHAT_MAX_MESSAGE_LENGTH: int = 4000
    CHAT_HISTORY_LIMIT: int = 100

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def admin_emails_set(self) -> set:
        raw = self.ADMIN_EMAILS.strip()
        if not raw:
            return {"akjonan256@gmail.com"}
        return {e.strip().lower() for e in raw.split(",") if e.strip()}

settings = Settings()

ADMIN_EMAILS = settings.admin_emails_set
