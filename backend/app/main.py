import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import init_db
from app.routers import auth, content, admin

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("uvicorn")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for Pixora Pinterest-style Recommendation Platform",
    version="1.0.0"
)

# CORS configuration
# In production, specify explicit allowed origins (e.g. ['https://pixora.vercel.app'])
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:3005",
        "http://127.0.0.1:3005",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Startup events
@app.on_event("startup")
async def startup_db_client():
    await init_db()

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

@app.get("/")
async def root():
    return {"message": "Welcome to Pixora API. Navigate to /docs for API documentation."}
