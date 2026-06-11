import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from app.database import get_collection
from app.models import ContentDB, UserDB

logger = logging.getLogger("uvicorn")

VALID_CATEGORIES = [
    "Nature", "Technology", "Recipes", "Travel", "Design", 
    "Artificial Intelligence", "Education", "Photography", "Fitness"
]

INTERACTION_WEIGHTS = {
    "view": 1.0,
    "like": 3.0,
    "save": 5.0,
    "share": 2.0,
    "comment": 4.0,       # High explicit engagement signal
    "watch": 1.5,         # Dwell time weight
    "unlike": -3.0,
    "unsave": -5.0
}

async def update_user_interest_profile(user_id: str):
    """
    Recalculates the user's interest profile based on their interactions
    and followed categories, then updates the user document in MongoDB.
    """
    users_col = get_collection("users")
    interactions_col = get_collection("interactions")
    content_col = get_collection("content")
    
    # 1. Fetch user
    user_doc = await users_col.find_one({"_id": user_id})
    if not user_doc:
        return
        
    followed = user_doc.get("followed_categories", [])
    
    # Initialize category scores
    cat_scores = {cat: 0.0 for cat in VALID_CATEGORIES}
    
    # Base weight for followed categories
    for cat in followed:
        if cat in cat_scores:
            cat_scores[cat] += 10.0
            
    # 2. Fetch last 100 interactions for the user
    cursor = interactions_col.find({"userId": user_id}).sort("timestamp", -1).limit(100)
    interactions = await cursor.to_list(length=100)
    
    # Fetch content details for these interactions to know their categories
    content_ids = [i["contentId"] for i in interactions]
    content_docs = await content_col.find({"_id": {"$in": content_ids}}).to_list(length=len(content_ids))
    content_map = {c["_id"]: c for c in content_docs}
    
    # Aggregate interaction weights
    for interact in interactions:
        c_id = interact["contentId"]
        action = interact["actionType"]
        weight = INTERACTION_WEIGHTS.get(action, 0.0)
        
        # Integrate watch history / dwell time
        # Scale view interactions by duration of view (if logged in database)
        dwell_time = interact.get("dwell_time") or interact.get("dwellTime") or 0.0
        if action == "view" and dwell_time > 0:
            import math
            weight = weight * (1.0 + math.log1p(dwell_time))
            
        content_item = content_map.get(c_id)
        if content_item:
            cat = content_item.get("category")
            if cat in cat_scores:
                cat_scores[cat] += weight
                
    # Keep scores non-negative
    for cat in cat_scores:
        cat_scores[cat] = max(0.0, cat_scores[cat])
        
    # 3. Normalize to sum to 1.0 (percentages)
    total_score = sum(cat_scores.values())
    interests = {}
    if total_score > 0:
        interests = {cat: round(score / total_score, 4) for cat, score in cat_scores.items() if score > 0}
    else:
        # Default even weights if no interaction or follow
        interests = {}
        
    # Update DB
    await users_col.update_one(
        {"_id": user_id},
        {"$set": {"interests": interests}}
    )
    logger.info(f"Updated interest profile for user {user_id}: {interests}")
    return interests


async def get_personalized_recommendations(user_id: Optional[str], limit: int = 20, skip: int = 0) -> List[Dict[str, Any]]:
    """
    Computes personalized recommendation scores for all content and returns sorted items.
    Formula: Score = (0.5 * InterestMatch) + (0.3 * Popularity) + (0.2 * Recency)
    """
    content_col = get_collection("content")
    users_col = get_collection("users")
    
    # Fetch all content
    # For a production app, we would use a two-stage system (retrieval then ranking).
    # Since we are implementing a demonstration system, we rank the candidate pool in-memory.
    all_content = await content_col.find({}).to_list(length=1000)
    if not all_content:
        return []
        
    # Get user interests
    user_interests = {}
    if user_id:
        user_doc = await users_col.find_one({"_id": user_id})
        if user_doc:
            user_interests = user_doc.get("interests", {})
            
    # Calculate min-max popularity bounds for normalization
    # Raw Popularity = views * 1 + likes * 3 + saves * 5 + shares * 2 + comments * 4
    raw_pops = []
    for c in all_content:
        views = c.get("views", 0)
        likes = c.get("likes", 0)
        saves = c.get("saves", 0)
        shares = c.get("shares", 0)
        comments = c.get("comments", 0)
        raw_pop = (views * 1.0) + (likes * 3.0) + (saves * 5.0) + (shares * 2.0) + (comments * 4.0)
        c["_raw_pop"] = raw_pop
        raw_pops.append(raw_pop)
        
    min_pop = min(raw_pops) if raw_pops else 0
    max_pop = max(raw_pops) if raw_pops else 0
    pop_range = max_pop - min_pop
    if pop_range == 0:
        pop_range = 1.0
        
    now = datetime.utcnow()
    ranked_content = []
    
    for c in all_content:
        # 1. Interest Match (0.0 to 1.0)
        category = c.get("category")
        interest_match = user_interests.get(category, 0.0)
        
        # 2. Popularity (0.0 to 1.0)
        popularity = (c["_raw_pop"] - min_pop) / pop_range
        
        # 3. Recency (0.0 to 1.0)
        created_at = c.get("created_at") or now
        if isinstance(created_at, str):
            try:
                created_at = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
            except Exception:
                created_at = now
        age_in_days = (now - created_at).total_seconds() / 86400.0
        recency = 1.0 / (1.0 + max(0.0, age_in_days))
        
        # Calculate final score
        score = (0.5 * interest_match) + (0.3 * popularity) + (0.2 * recency)
        
        # Store for dashboard inspection debugging
        c["_rec_score"] = round(score, 4)
        c["_score_breakdown"] = {
            "interest_match": round(0.5 * interest_match, 4),
            "popularity": round(0.3 * popularity, 4),
            "recency": round(0.2 * recency, 4)
        }
        ranked_content.append(c)
        
    # Sort by recommendation score descending
    ranked_content = sorted(ranked_content, key=lambda x: x["_rec_score"], reverse=True)
    
    # Paginate
    paginated = ranked_content[skip:skip+limit]
    return paginated
