import os
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
import asyncio
from app.database import init_db, get_collection
from app.routers import auth, content, admin, messages

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("uvicorn")

async def google_drive_sync_loop():
    await asyncio.sleep(10)  # Wait 10 seconds for initial startup
    logger.info("Google Drive periodic sync scheduler started.")
    while True:
        try:
            settings_col = get_collection("settings")
            sync_config = await settings_col.find_one({"key": "google_drive_sync_folder_id"})
            
            if sync_config:
                folder_id = sync_config.get("value")
                is_parent = sync_config.get("is_parent", True)
                category = sync_config.get("category") or "Nature"
                
                logger.info(f"Running periodic Google Drive sync for folder: {folder_id} (is_parent={is_parent})")
                
                from app.services.ingestion import ingest_google_drive_parent_folder, ingest_google_drive_folder
                if is_parent:
                    items = await ingest_google_drive_parent_folder(
                        parent_folder_id=folder_id,
                        count=50
                    )
                else:
                    items = await ingest_google_drive_folder(
                        folder_id=folder_id,
                        category=category,
                        count=50
                    )
                
                if items:
                    content_col = get_collection("content")
                    inserted_count = 0
                    for item in items:
                        existing = await content_col.find_one({"image_url": item["image_url"]})
                        if not existing:
                            await content_col.insert_one(item)
                            inserted_count += 1
                    if inserted_count > 0:
                        logger.info(f"Periodic Google Drive sync completed. Inserted {inserted_count} new items.")
                    else:
                        logger.info("Periodic Google Drive sync: no new items found.")
                else:
                    logger.info("Periodic Google Drive sync: no items found or API failed.")
            else:
                logger.info("No Google Drive sync folder registered yet. Import a folder in the Admin panel to start auto-sync.")
        except Exception as e:
            logger.error(f"Error in Google Drive periodic sync: {e}", exc_info=True)
            
        await asyncio.sleep(600)  # Run every 10 minutes (600 seconds)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for Pixora Pinterest-style Recommendation Platform",
    version="1.0.0"
)

# CORS configuration
# In production, specify explicit allowed origins (e.g. ['https://pixora.vercel.app'])
default_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:3002",
    "http://127.0.0.1:3002",
    "http://localhost:3005",
    "http://127.0.0.1:3005",
    "https://pixora-q5c9.vercel.app",
    "https://pixora-lake.vercel.app",
]

allowed_origins_env = os.getenv("ALLOWED_ORIGINS")
if allowed_origins_env:
    allowed_origins = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()]
else:
    allowed_origins = default_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Startup events
@app.on_event("startup")
async def startup_db_client():
    await init_db()
    asyncio.create_task(google_drive_sync_loop())

# Security Header Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    # Anti-clickjacking
    response.headers["X-Frame-Options"] = "DENY"
    # XSS Protection
    response.headers["X-Content-Type-Options"] = "nosniff"
    # Content Security Policy (strict defaults)
    response.headers["Content-Security-Policy"] = "default-src 'self'; frame-ancestors 'none';"
    # Referrer policy
    response.headers["Referrer-Policy"] = "no-referrer-when-downgrade"
    return response

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception occurred: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occurred. Please try again later."}
    )

# Include Routers
app.include_router(auth.router)
app.include_router(content.router)
app.include_router(admin.router)
app.include_router(messages.router)

@app.get("/")
async def root():
    return {"message": "Welcome to Pixora API. Navigate to /docs for API documentation."}
