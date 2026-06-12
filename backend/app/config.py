import os
import secrets
import logging
from pydantic_settings import BaseSettings

logger = logging.getLogger("uvicorn")

def get_jwt_secret() -> str:
    # 1. Check environment variable
    secret = os.getenv("JWT_SECRET_KEY")
    if secret:
        return secret
        
    # 2. Check local file
    secret_file_path = os.path.join(os.path.dirname(__file__), "..", "jwt_secret.txt")
    if os.path.exists(secret_file_path):
        try:
            with open(secret_file_path, "r") as f:
                return f.read().strip()
        except Exception as e:
            logger.warning(f"Failed to read jwt_secret.txt: {e}")

    # 3. Fallback: Generate secure random key and warn
    logger.warning("JWT_SECRET_KEY not found in environment or local file! Generating an ephemeral random secret key. THIS WILL CAUSE MULTI-INSTANCE INCOMPATIBILITY.")
    generated_secret = secrets.token_hex(32)
    # Attempt to cache it to a file so server reloads don't log out users
    try:
        with open(secret_file_path, "w") as f:
            f.write(generated_secret)
    except Exception as e:
        logger.warning(f"Could not persist generated secret to jwt_secret.txt: {e}")
    return generated_secret

class Settings(BaseSettings):
    PROJECT_NAME: str = "Pixora API"
    MONGODB_URL: str = "mongodb://127.0.0.1:27017/pixora"
    DATABASE_NAME: str = "pixora"
    JWT_SECRET_KEY: str = get_jwt_secret()
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    
    # Ingestion APIs (Optional)
    UNSPLASH_ACCESS_KEY: str = ""
    PEXELS_API_KEY: str = ""
    GOOGLE_DRIVE_API_KEY: str = ""
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REFRESH_TOKEN: str = ""
    GOOGLE_ACCESS_TOKEN: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
