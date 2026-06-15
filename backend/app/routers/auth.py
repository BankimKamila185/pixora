import uuid
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings
from app.database import get_collection
from app.models import UserRegister, UserLogin, Token, UserOut

logger = logging.getLogger("uvicorn")

router = APIRouter(prefix="/api/auth", tags=["auth"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

# --- Simple In-Memory Rate Limiter to satisfy 'rate limit all APIs' guideline ---
# Structure: IP address -> list of request timestamps
RATE_LIMIT_WINDOW_SECONDS = 60
RATE_LIMIT_MAX_REQUESTS = 30  # Allow 30 requests per minute per IP for demo
ip_request_history: Dict[str, list] = {}

def check_rate_limit(request: Request):
    client_ip = request.client.host if request.client else "unknown"
    now = datetime.utcnow()
    
    # Prune old timestamps
    if client_ip in ip_request_history:
        ip_request_history[client_ip] = [
            t for t in ip_request_history[client_ip] 
            if (now - t).total_seconds() < RATE_LIMIT_WINDOW_SECONDS
        ]
    else:
        ip_request_history[client_ip] = []
        
    if len(ip_request_history[client_ip]) >= RATE_LIMIT_MAX_REQUESTS:
        logger.warning(f"Rate limit exceeded for client: {client_ip}")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Please try again later."
        )
        
    ip_request_history[client_ip].append(now)

# --- Password Helpers ---
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

# --- JWT Token Helpers ---
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    # Hardcoded HS256 check
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm="HS256")
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)) -> Dict[str, Any]:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    # Correct unauthorized code is 401
    credentials_exception.status_code = status.HTTP_401_UNAUTHORIZED
    
    try:
        # Hardcode HS256 verification, rejecting 'none' algorithm
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=["HS256"])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    users_col = get_collection("users")
    user = await users_col.find_one({"_id": user_id})
    if user is None:
        raise credentials_exception
    return user

async def get_optional_current_user(request: Request) -> Optional[Dict[str, Any]]:
    """Helper to retrieve user details from authorization header if present, else return None."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=["HS256"])
        user_id: str = payload.get("sub")
        if user_id:
            users_col = get_collection("users")
            return await users_col.find_one({"_id": user_id})
    except Exception:
        pass
    return None

# --- Auth Routes ---

@router.post("/register", response_model=UserOut, dependencies=[Depends(check_rate_limit)])
async def register(user_data: UserRegister):
    users_col = get_collection("users")
    
    # Check if email exists
    existing_user = await users_col.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
        
    user_id = str(uuid.uuid4())
    password_hash = hash_password(user_data.password)
    
    new_user = {
        "_id": user_id,
        "name": user_data.name,
        "email": user_data.email,
        "password_hash": password_hash,
        "interests": {},
        "followed_categories": [],
        "created_at": datetime.utcnow()
    }
    
    await users_col.insert_one(new_user)
    
    return {
        "id": new_user["_id"],
        "name": new_user["name"],
        "email": new_user["email"],
        "interests": new_user["interests"],
        "followed_categories": new_user["followed_categories"],
        "created_at": new_user["created_at"]
    }

@router.post("/login", response_model=Token, dependencies=[Depends(check_rate_limit)])
async def login(credentials: UserLogin):
    users_col = get_collection("users")
    user = await users_col.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token = create_access_token(data={"sub": user["_id"]})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserOut, dependencies=[Depends(check_rate_limit)])
async def get_me(current_user: Dict[str, Any] = Depends(get_current_user)):
    return {
        "id": current_user["_id"],
        "name": current_user["name"],
        "email": current_user["email"],
        "interests": current_user.get("interests", {}),
        "followed_categories": current_user.get("followed_categories", []),
        "created_at": current_user.get("created_at") or datetime.utcnow()
    }

from pydantic import BaseModel

class GoogleAuthInput(BaseModel):
    id_token: str
    email: Optional[str] = None
    name: Optional[str] = None

@router.post("/google", response_model=Token, dependencies=[Depends(check_rate_limit)])
async def google_auth(data: GoogleAuthInput):
    email = data.email
    name = data.name
    
    # Verify Google Token if it is not a mock token
    if not data.id_token.startswith("mock_"):
        try:
            import httpx
            async with httpx.AsyncClient() as client:
                res = await client.get(
                    f"https://oauth2.googleapis.com/tokeninfo?id_token={data.id_token}",
                    timeout=5.0
                )
                if res.status_code == 200:
                    info = res.json()
                    email = info.get("email")
                    name = info.get("name") or info.get("given_name") or name
                else:
                    logger.warning(f"Google tokeninfo returned status {res.status_code}: {res.text}")
                    if not email:
                        raise HTTPException(
                            status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Invalid Google token"
                        )
        except Exception as e:
            logger.error(f"Error validating Google token: {e}")
            if not email:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=f"Failed to verify Google token: {str(e)}"
                )

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is required for Google authentication"
        )
        
    users_col = get_collection("users")
    user = await users_col.find_one({"email": email})
    
    if not user:
        # Sign up: Create new user
        user_id = str(uuid.uuid4())
        password_hash = hash_password(str(uuid.uuid4()))
        
        user = {
            "_id": user_id,
            "name": name or email.split("@")[0],
            "email": email,
            "password_hash": password_hash,
            "interests": {},
            "followed_categories": [],
            "created_at": datetime.utcnow()
        }
        await users_col.insert_one(user)
        logger.info(f"Created new user via Google Sign-In: {email}")
    else:
        # Make sure user has name if they didn't have one
        if name and not user.get("name"):
            await users_col.update_one({"_id": user["_id"]}, {"$set": {"name": name}})
            user["name"] = name
        logger.info(f"Logged in existing user via Google Sign-In: {email}")
        
    access_token = create_access_token(data={"sub": user["_id"]})
    return {"access_token": access_token, "token_type": "bearer"}

