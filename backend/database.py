# backend/database.py
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Use the correct dialect for Psycopg 3
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://joapp_user:secure_password@db:5432/joapp_db")

# Important: Use postgresql+psycopg:// for Psycopg 3
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,           # Good for Render / cloud DBs
    pool_recycle=300,             # Helps prevent stale connections
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
