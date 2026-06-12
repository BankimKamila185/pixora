import uuid
import logging
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, status, Request

from app.database import get_collection
from app.models import ContentOut, OnboardingInterests, ContentDB
from app.routers.auth import get_current_user, get_optional_current_user, check_rate_limit
from app.services.recommendation import (
    get_personalized_recommendations,
    update_user_interest_profile,
    VALID_CATEGORIES
)

logger = logging.getLogger("uvicorn")
router = APIRouter(prefix="", tags=["content"])  # prefix is empty so path matches user/admin specs

@router.get("/api/categories", dependencies=[Depends(check_rate_limit)])
async def get_categories():
    return VALID_CATEGORIES

# --- Core Feeds ---

@router.get("/api/content", response_model=List[ContentOut], dependencies=[Depends(check_rate_limit)])
async def get_content_feed(
    request: Request,
    category: Optional[str] = None,
    limit: int = 20,
    skip: int = 0,
    current_user: Optional[Dict[str, Any]] = Depends(get_optional_current_user)
):
    content_col = get_collection("content")
    interactions_col = get_collection("interactions")
    
    # If a specific category filter is requested, return sorted by latest
    if category:
        if category not in VALID_CATEGORIES:
            raise HTTPException(status_code=400, detail="Invalid category")
        cursor = content_col.find({"category": category}).sort("created_at", -1).skip(skip).limit(limit)
        items = await cursor.to_list(length=limit)
    else:
        # If logged in, get personalized recommendations
        if current_user:
            user_id = current_user["_id"]
            items = await get_personalized_recommendations(user_id, limit=limit, skip=skip)
        else:
            # Guest feed: Default sorted by latest
            cursor = content_col.find({}).sort("created_at", -1).skip(skip).limit(limit)
            items = await cursor.to_list(length=limit)
            
    # Enrich content items with liked_by_user and saved_by_user flags
    enriched_items = []
    for item in items:
        # Cast item to dict if not already
        item_dict = dict(item)
        item_id = item_dict.get("_id") or item_dict.get("id")
        # Standardize ID field name
        item_dict["id"] = item_id
        
        if current_user:
            user_id = current_user["_id"]
            liked = await interactions_col.find_one({"userId": user_id, "contentId": item_id, "actionType": "like"})
            saved = await interactions_col.find_one({"userId": user_id, "contentId": item_id, "actionType": "save"})
            item_dict["liked_by_user"] = liked is not None
            item_dict["saved_by_user"] = saved is not None
        else:
            item_dict["liked_by_user"] = False
            item_dict["saved_by_user"] = False
            
        enriched_items.append(item_dict)
        
    return enriched_items

@router.get("/api/content/trending", response_model=List[ContentOut], dependencies=[Depends(check_rate_limit)])
async def get_trending_feed(
    limit: int = 20,
    skip: int = 0,
    current_user: Optional[Dict[str, Any]] = Depends(get_optional_current_user)
):
    content_col = get_collection("content")
    interactions_col = get_collection("interactions")
    
    # Sort by views, likes, saves combined popularity score
    # Formula for ranking: (likes * 3) + (saves * 5) + views
    # In mock db/simple mongo, we retrieve candidates and sort in memory, or query sorting
    all_content = await content_col.find({}).to_list(length=500)
    for c in all_content:
        c["id"] = c.get("_id")
        c["pop_score"] = (c.get("likes", 0) * 3) + (c.get("saves", 0) * 5) + c.get("views", 0)
        
    sorted_items = sorted(all_content, key=lambda x: x["pop_score"], reverse=True)
    items = sorted_items[skip:skip+limit]
    
    enriched_items = []
    for item in items:
        item_dict = dict(item)
        item_id = item_dict["id"]
        
        if current_user:
            user_id = current_user["_id"]
            liked = await interactions_col.find_one({"userId": user_id, "contentId": item_id, "actionType": "like"})
            saved = await interactions_col.find_one({"userId": user_id, "contentId": item_id, "actionType": "save"})
            item_dict["liked_by_user"] = liked is not None
            item_dict["saved_by_user"] = saved is not None
        else:
            item_dict["liked_by_user"] = False
            item_dict["saved_by_user"] = False
            
        enriched_items.append(item_dict)
        
    return enriched_items

@router.get("/api/content/search", response_model=List[ContentOut], dependencies=[Depends(check_rate_limit)])
async def search_content(
    q: Optional[str] = None,
    category: Optional[str] = None,
    current_user: Optional[Dict[str, Any]] = Depends(get_optional_current_user)
):
    content_col = get_collection("content")
    interactions_col = get_collection("interactions")
    
    query: Dict[str, Any] = {}
    if category:
        if category in VALID_CATEGORIES:
            query["category"] = category
            
    # Text match on title/description or tags
    if q:
        # Simple regex matching for title, description, or tags
        # In a real Mongo app we could use $text search or regex
        # For compatibility with mock DB, we filter manually or use basic regex if supported.
        # Let's write manual filters to ensure 100% Mock DB compatibility and correct matching.
        all_items = await content_col.find(query).to_list(length=1000)
        search_terms = q.lower().split()
        matched_items = []
        for item in all_items:
            title = item.get("title", "").lower()
            desc = item.get("description", "").lower()
            tags = [t.lower() for t in item.get("tags", [])]
            
            # Match if any term matches title, description, or tags
            if any(term in title or term in desc or any(term in tag for tag in tags) for term in search_terms):
                matched_items.append(item)
        items = matched_items
    else:
        items = await content_col.find(query).to_list(length=100)
        
    # Enrich
    enriched_items = []
    for item in items:
        item_dict = dict(item)
        item_id = item_dict.get("_id") or item_dict.get("id")
        item_dict["id"] = item_id
        
        if current_user:
            user_id = current_user["_id"]
            liked = await interactions_col.find_one({"userId": user_id, "contentId": item_id, "actionType": "like"})
            saved = await interactions_col.find_one({"userId": user_id, "contentId": item_id, "actionType": "save"})
            item_dict["liked_by_user"] = liked is not None
            item_dict["saved_by_user"] = saved is not None
        else:
            item_dict["liked_by_user"] = False
            item_dict["saved_by_user"] = False
            
        enriched_items.append(item_dict)
        
    return enriched_items

# --- Single Content Details and Interactions ---

@router.get("/api/content/{content_id}", response_model=ContentOut, dependencies=[Depends(check_rate_limit)])
async def get_content_details(
    content_id: str,
    current_user: Optional[Dict[str, Any]] = Depends(get_optional_current_user)
):
    content_col = get_collection("content")
    interactions_col = get_collection("interactions")
    
    # 1. Fetch item
    content_item = await content_col.find_one({"_id": content_id})
    if not content_item:
        raise HTTPException(status_code=404, detail="Content not found")
        
    # 2. Increment view count
    await content_col.update_one({"_id": content_id}, {"$inc": {"views": 1}})
    content_item["views"] += 1
    content_item["id"] = content_item["_id"]
    
    # 3. Track view interaction if user is logged in
    if current_user:
        user_id = current_user["_id"]
        # Log view interaction
        view_interaction = {
            "_id": str(uuid.uuid4()),
            "userId": user_id,
            "contentId": content_id,
            "actionType": "view",
            "timestamp": datetime.utcnow()
        }
        await interactions_col.insert_one(view_interaction)
        # Recalculate interest profile asynchronously
        await update_user_interest_profile(user_id)
        
        # Enrich liked/saved flags
        liked = await interactions_col.find_one({"userId": user_id, "contentId": content_id, "actionType": "like"})
        saved = await interactions_col.find_one({"userId": user_id, "contentId": content_id, "actionType": "save"})
        content_item["liked_by_user"] = liked is not None
        content_item["saved_by_user"] = saved is not None
    else:
        content_item["liked_by_user"] = False
        content_item["saved_by_user"] = False
        
    return content_item


@router.post("/api/content/{content_id}/like", dependencies=[Depends(check_rate_limit)])
async def toggle_like_content(
    content_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    content_col = get_collection("content")
    interactions_col = get_collection("interactions")
    user_id = current_user["_id"]
    
    content_item = await content_col.find_one({"_id": content_id})
    if not content_item:
        raise HTTPException(status_code=404, detail="Content not found")
        
    # Check if already liked
    existing_like = await interactions_col.find_one({
        "userId": user_id,
        "contentId": content_id,
        "actionType": "like"
    })
    
    if existing_like:
        # Toggle unlike: Delete positive interaction, record negative interaction
        await interactions_col.delete_one({"_id": existing_like["_id"]})
        
        # Optional: insert unlike log to track history for profile decay
        unlike_log = {
            "_id": str(uuid.uuid4()),
            "userId": user_id,
            "contentId": content_id,
            "actionType": "unlike",
            "timestamp": datetime.utcnow()
        }
        await interactions_col.insert_one(unlike_log)
        
        # Decrement like count
        new_likes = max(0, content_item.get("likes", 0) - 1)
        await content_col.update_one({"_id": content_id}, {"$set": {"likes": new_likes}})
        
        await update_user_interest_profile(user_id)
        return {"liked": False, "likes": new_likes}
    else:
        # Toggle like
        new_like = {
            "_id": str(uuid.uuid4()),
            "userId": user_id,
            "contentId": content_id,
            "actionType": "like",
            "timestamp": datetime.utcnow()
        }
        await interactions_col.insert_one(new_like)
        
        # Increment like count
        new_likes = content_item.get("likes", 0) + 1
        await content_col.update_one({"_id": content_id}, {"$set": {"likes": new_likes}})
        
        await update_user_interest_profile(user_id)
        return {"liked": True, "likes": new_likes}


@router.post("/api/content/{content_id}/save", dependencies=[Depends(check_rate_limit)])
async def toggle_save_content(
    content_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    content_col = get_collection("content")
    interactions_col = get_collection("interactions")
    user_id = current_user["_id"]
    
    content_item = await content_col.find_one({"_id": content_id})
    if not content_item:
        raise HTTPException(status_code=404, detail="Content not found")
        
    existing_save = await interactions_col.find_one({
        "userId": user_id,
        "contentId": content_id,
        "actionType": "save"
    })
    
    if existing_save:
        # Unsave
        await interactions_col.delete_one({"_id": existing_save["_id"]})
        
        unsave_log = {
            "_id": str(uuid.uuid4()),
            "userId": user_id,
            "contentId": content_id,
            "actionType": "unsave",
            "timestamp": datetime.utcnow()
        }
        await interactions_col.insert_one(unsave_log)
        
        new_saves = max(0, content_item.get("saves", 0) - 1)
        await content_col.update_one({"_id": content_id}, {"$set": {"saves": new_saves}})
        
        await update_user_interest_profile(user_id)
        return {"saved": False, "saves": new_saves}
    else:
        # Save
        new_save = {
            "_id": str(uuid.uuid4()),
            "userId": user_id,
            "contentId": content_id,
            "actionType": "save",
            "timestamp": datetime.utcnow()
        }
        await interactions_col.insert_one(new_save)
        
        new_saves = content_item.get("saves", 0) + 1
        await content_col.update_one({"_id": content_id}, {"$set": {"saves": new_saves}})
        
        await update_user_interest_profile(user_id)
        return {"saved": True, "saves": new_saves}


@router.post("/api/content/{content_id}/share", dependencies=[Depends(check_rate_limit)])
async def share_content(
    content_id: str,
    current_user: Optional[Dict[str, Any]] = Depends(get_optional_current_user)
):
    content_col = get_collection("content")
    interactions_col = get_collection("interactions")
    
    content_item = await content_col.find_one({"_id": content_id})
    if not content_item:
        raise HTTPException(status_code=404, detail="Content not found")
        
    await content_col.update_one({"_id": content_id}, {"$inc": {"shares": 1}})
    new_shares = content_item.get("shares", 0) + 1
    
    if current_user:
        user_id = current_user["_id"]
        share_log = {
            "_id": str(uuid.uuid4()),
            "userId": user_id,
            "contentId": content_id,
            "actionType": "share",
            "timestamp": datetime.utcnow()
        }
        await interactions_col.insert_one(share_log)
        await update_user_interest_profile(user_id)
        
    return {"shares": new_shares}

# --- Onboarding and Follow Categories ---

@router.post("/api/users/onboarding", dependencies=[Depends(check_rate_limit)])
async def save_onboarding_interests(
    onboarding: OnboardingInterests,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    users_col = get_collection("users")
    user_id = current_user["_id"]
    
    # Validate categories
    valid_choices = [c for c in onboarding.categories if c in VALID_CATEGORIES]
    if not valid_choices:
        raise HTTPException(status_code=400, detail="Must select at least one valid category")
        
    await users_col.update_one(
        {"_id": user_id},
        {"$set": {"followed_categories": valid_choices}}
    )
    
    # Recalculate interest profile with new baseline
    await update_user_interest_profile(user_id)
    return {"message": "Onboarding successful", "followed_categories": valid_choices}


@router.get("/api/users/profile", response_model=Dict[str, Any], dependencies=[Depends(check_rate_limit)])
async def get_user_profile(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    content_col = get_collection("content")
    interactions_col = get_collection("interactions")
    user_id = current_user["_id"]
    
    # Fetch liked posts
    liked_cursor = interactions_col.find({"userId": user_id, "actionType": "like"}).sort("timestamp", -1)
    liked_interactions = await liked_cursor.to_list(length=100)
    liked_ids = [i["contentId"] for i in liked_interactions]
    liked_content = await content_col.find({"_id": {"$in": liked_ids}}).to_list(length=len(liked_ids))
    # Standardize output model mapping
    for l in liked_content:
        l["id"] = l["_id"]
        l["liked_by_user"] = True
        
    # Fetch saved posts
    saved_cursor = interactions_col.find({"userId": user_id, "actionType": "save"}).sort("timestamp", -1)
    saved_interactions = await saved_cursor.to_list(length=100)
    saved_ids = [i["contentId"] for i in saved_interactions]
    saved_content = await content_col.find({"_id": {"$in": saved_ids}}).to_list(length=len(saved_ids))
    for s in saved_content:
        s["id"] = s["_id"]
        s["saved_by_user"] = True
        
    # Fetch recent activities
    activity_cursor = interactions_col.find({"userId": user_id}).sort("timestamp", -1).limit(10)
    activities = await activity_cursor.to_list(length=10)
    
    # Map content titles for activity details
    activity_c_ids = [a["contentId"] for a in activities]
    act_contents = await content_col.find({"_id": {"$in": activity_c_ids}}).to_list(length=len(activity_c_ids))
    content_titles = {c["_id"]: c["title"] for c in act_contents}
    
    formatted_activities = []
    for a in activities:
        formatted_activities.append({
            "action": a["actionType"],
            "content_title": content_titles.get(a["contentId"], "Unknown Content"),
            "content_id": a["contentId"],
            "timestamp": a["timestamp"]
        })
        
    return {
        "user": {
            "id": current_user["_id"],
            "name": current_user["name"],
            "email": current_user["email"],
            "interests": current_user.get("interests", {}),
            "followed_categories": current_user.get("followed_categories", []),
            "created_at": current_user.get("created_at") or datetime.utcnow()
        },
        "liked_posts": liked_content,
        "saved_posts": saved_content,
        "recent_activities": formatted_activities
    }


from pydantic import BaseModel, Field

class CommentCreate(BaseModel):
    comment_text: str = Field(..., min_length=1, max_length=500)

class DwellTimeCreate(BaseModel):
    dwell_time: float = Field(..., gt=0.0)

@router.post("/api/content/{content_id}/comment", dependencies=[Depends(check_rate_limit)])
async def comment_content(
    content_id: str,
    comment_data: CommentCreate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    content_col = get_collection("content")
    interactions_col = get_collection("interactions")
    user_id = current_user["_id"]
    
    content_item = await content_col.find_one({"_id": content_id})
    if not content_item:
        raise HTTPException(status_code=404, detail="Content not found")
        
    # Insert interaction log
    new_comment = {
        "_id": str(uuid.uuid4()),
        "userId": user_id,
        "contentId": content_id,
        "actionType": "comment",
        "comment_text": comment_data.comment_text,
        "timestamp": datetime.utcnow()
    }
    await interactions_col.insert_one(new_comment)
    
    # Increment comment count
    new_comments_count = content_item.get("comments", 0) + 1
    await content_col.update_one({"_id": content_id}, {"$set": {"comments": new_comments_count}})
    
    # Recalculate profile
    await update_user_interest_profile(user_id)
    return {"message": "Comment added successfully", "comments": new_comments_count}


@router.post("/api/content/{content_id}/watch", dependencies=[Depends(check_rate_limit)])
async def watch_content(
    content_id: str,
    dwell_data: DwellTimeCreate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    content_col = get_collection("content")
    interactions_col = get_collection("interactions")
    user_id = current_user["_id"]
    
    content_item = await content_col.find_one({"_id": content_id})
    if not content_item:
        raise HTTPException(status_code=404, detail="Content not found")
        
    # Insert interaction log as actionType="view" with dwellTime
    new_watch = {
        "_id": str(uuid.uuid4()),
        "userId": user_id,
        "contentId": content_id,
        "actionType": "view",
        "dwellTime": dwell_data.dwell_time,
        "timestamp": datetime.utcnow()
    }
    await interactions_col.insert_one(new_watch)
    
    # Recalculate profile
    await update_user_interest_profile(user_id)
    return {"message": "Watch history recorded"}


@router.get("/api/content/image-proxy/{file_id}")
async def google_drive_image_proxy(file_id: str):
    import httpx
    from fastapi.responses import Response
    from app.config import settings
    from app.services.ingestion import get_google_access_token
    
    # Resolve authorization
    access_token = await get_google_access_token()
    headers = {}
    params = {}
    if access_token:
        headers["Authorization"] = f"Bearer {access_token}"
    elif settings.GOOGLE_DRIVE_API_KEY:
        params["key"] = settings.GOOGLE_DRIVE_API_KEY
    else:
        raise HTTPException(status_code=400, detail="Google Drive credentials not configured on backend")

    # Fetch file content from Google Drive API
    url = f"https://www.googleapis.com/drive/v3/files/{file_id}"
    params["alt"] = "media"
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers, params=params, timeout=20.0, follow_redirects=True)
            if response.status_code != 200:
                logger.error(f"Image proxy failed for file {file_id}: {response.status_code} - {response.text}")
                raise HTTPException(status_code=response.status_code, detail="Failed to fetch image from Google Drive")
            
            content_type = response.headers.get("content-type", "image/jpeg")
            return Response(content=response.content, media_type=content_type)
        except Exception as e:
            logger.error(f"Image proxy request failed for file {file_id}: {e}")
            raise HTTPException(status_code=500, detail=f"Image proxy error: {str(e)}")


