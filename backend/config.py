# config.py
# All your settings live here. Change these values for your setup.
# In production, these come from environment variables (Railway, Render, etc.)

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # --- Email alert settings ---
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = "your-gmail@gmail.com"
    SMTP_PASSWORD: str = "your-app-password"
    ALERT_FROM: str = "PhalanxAI Alerts <your-gmail@gmail.com>"

    # --- Database ---
    DATABASE_URL: str = "phalanx.db"

    # --- Security ---
    INTERNAL_SECRET: str = "phalanx-dev-secret-2026"

    # --- Safety ---
    MAX_PAYLOAD_LENGTH: int = 1000

    # Pydantic v2 config
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()