import os
from typing import Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database Configuration — loaded from .env / environment variables
    DATABASE_URL: Optional[str] = None
    DB_USER: Optional[str] = None
    DB_PASSWORD: Optional[str] = None
    DB_HOST: Optional[str] = None
    DB_NAME: Optional[str] = None
    DB_PORT: Optional[int] = 5432

    # JWT Configuration — loaded from .env / environment variables
    JWT_SECRET_KEY: Optional[str] = None
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

    # Twilio SMS Configuration
    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    TWILIO_FROM_NUMBER: Optional[str] = None

    # Brevo (Sendinblue) Email API — loaded from .env
    BREVO_API_KEY: Optional[str] = None
    BREVO_FROM_EMAIL: Optional[str] = None

    # Gemini AI Configuration
    GEMINI_API_KEY: Optional[str] = None


    @property
    def database_url(self) -> str:
        if self.DATABASE_URL:
            url = self.DATABASE_URL
            if url.startswith("postgres://"):
                url = url.replace("postgres://", "postgresql://", 1)
            return url
        import urllib.parse
        db_user = self.DB_USER or "postgres"
        db_pass = self.DB_PASSWORD or ""
        db_host = self.DB_HOST or "localhost"
        db_name = self.DB_NAME or "smartemi"
        db_port = self.DB_PORT or 5432
        quoted_password = urllib.parse.quote_plus(urllib.parse.unquote(db_pass))
        return f"postgresql://{db_user}:{quoted_password}@{db_host}:{db_port}/{db_name}"

    class Config:
        env_file = os.path.join(os.path.dirname(__file__), ".env")
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
