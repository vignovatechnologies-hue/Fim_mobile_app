import os
from typing import Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DB_USER: str = "postgres"
    DB_PASSWORD: str = "Yashwanth%40567"
    DB_HOST: str = "localhost"
    DB_NAME: str = "smartemi"
    DB_PORT: int = 5433
    JWT_SECRET_KEY: str = "supersecretkeyforfimsmartemiapp123456"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # Razorpay — loaded from .env
    RAZORPAY_KEY_ID: Optional[str] = None
    RAZORPAY_KEY_SECRET: Optional[str] = None
    RAZORPAY_WEBHOOK_SECRET: Optional[str] = None  # Set in Razorpay Dashboard → Webhooks

    # SendGrid — loaded from .env
    SENDGRID_API_KEY: Optional[str] = None
    SENDGRID_FROM_EMAIL: Optional[str] = None

    # SMTP config (Python equivalent of Nodemailer) — loaded from .env
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USERNAME: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM_EMAIL: Optional[str] = None

    @property
    def database_url(self) -> str:
        import urllib.parse
        # Ensure password is URL encoded so characters like @ do not break URL parsing
        quoted_password = urllib.parse.quote_plus(urllib.parse.unquote(self.DB_PASSWORD))
        return f"postgresql://{self.DB_USER}:{quoted_password}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    class Config:
        env_file = os.path.join(os.path.dirname(__file__), ".env")
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
