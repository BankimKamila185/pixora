from pydantic import BaseModel, EmailStr, Field
from typing import List, Dict, Optional, Any
from datetime import datetime

# --- DATABASE MODELS (what goes in / comes out of MongoDB) ---

class UserDB(BaseModel):
    id: str = Field(alias="_id")
    name: str
    email: EmailStr
    password_hash: str
    interests: Dict[str, float] = Field(default_factory=dict)  # category -> weight (0.0 to 1.0)
    followed_categories: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ContentDB(BaseModel):
    id: str = Field(alias="_id")
    title: str
    description: str
    image_url: str
    category: str
    source: str = "Pexels"
    tags: List[str] = Field(default_factory=list)
    likes: int = 0
    saves: int = 0
    views: int = 0
    shares: int = 0
    comments: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class InteractionDB(BaseModel):
    id: str = Field(alias="_id")
    user_id: str
    content_id: str
    action_type: str  # "view", "like", "save", "share", "unlike", "unsave", "comment", "watch"
    comment_text: Optional[str] = None
    dwell_time: Optional[float] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class RecommendationDB(BaseModel):
    id: str = Field(alias="_id")
    user_id: str
    content_ids: List[str]
    generated_at: datetime = Field(default_factory=datetime.utcnow)

# --- REQUEST / RESPONSE SCHEMAS ---

class UserRegister(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters.")

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[str] = None

class UserOut(BaseModel):
    id: str
    name: str
    email: EmailStr
    interests: Dict[str, float]
    followed_categories: List[str]
    created_at: datetime

class ContentOut(BaseModel):
    id: str
    title: str
    description: str
    image_url: str
    category: str
    source: str
    tags: List[str]
    likes: int
    saves: int
    views: int
    shares: int
    comments: int = 0
    created_at: datetime
    
    # Client utility flags
    liked_by_user: Optional[bool] = False
    saved_by_user: Optional[bool] = False

class ContentCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=150)
    description: str = Field(..., max_length=1000)
    image_url: str = Field(..., description="Valid absolute image URL")
    category: str = Field(..., description="Nature, Technology, Recipes, Travel, Design, Artificial Intelligence, Education, Photography, Fitness")
    source: Optional[str] = Field("Pexels", description="Ingestion source name")
    tags: List[str] = Field(default_factory=list)

class ContentUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=150)
    description: Optional[str] = Field(None, max_length=1000)
    image_url: Optional[str] = None
    category: Optional[str] = None
    source: Optional[str] = None
    tags: Optional[List[str]] = None

class OnboardingInterests(BaseModel):
    categories: List[str]

# --- DASHBOARD & ANALYTICS SCHEMAS ---

class KPISummary(BaseModel):
    total_users: int
    total_content: int
    total_views: int
    total_likes: int
    total_saves: int
    total_shares: int

class UserEngagementProfile(BaseModel):
    user_id: str
    name: str
    email: EmailStr
    total_views: int
    total_likes: int
    total_saves: int
    favorite_categories: List[str]
    recent_activities: List[Dict[str, Any]]
    engagement_score: float  # calculated score

class RecommendationMetrics(BaseModel):
    accuracy: float
    most_recommended_categories: List[Dict[str, Any]]
    user_engagement_rate: float
    feed_performance_metrics: Dict[str, Any]

class GrowthDataPoint(BaseModel):
    date: str
    users: int

class ActivityDataPoint(BaseModel):
    date: str
    views: int
    likes: int
    saves: int

class CategoryPopularityPoint(BaseModel):
    category: str
    count: int
    views: int
