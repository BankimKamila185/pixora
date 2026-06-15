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
    "like": 5.0,      # Raised: like is a strong positive signal
    "save": 8.0,      # Raised: save is the strongest signal
    "share": 3.0,
    "comment": 6.0,   # High explicit engagement
    "watch": 1.5,
    "unlike": -5.0,
    "unsave": -8.0
}

async def update_user_interest_profile(user_id: str):
    """
    Recalculates the user's interest profile based on their interactions.
    Strong signals (like, save, comment) heavily boost a category.
    """
    users_col = get_collection("users")
    interactions_col = get_collection("interactions")
    content_col = get_collection("content")
    
    user_doc = await users_col.find_one({"_id": user_id})
    if not user_doc:
        return
        
    followed = user_doc.get("followed_categories", [])
    
    # Initialize — followed categories get a baseline boost
    cat_scores = {cat: 0.0 for cat in VALID_CATEGORIES}
    for cat in followed:
        if cat in cat_scores:
            cat_scores[cat] += 15.0  # Stronger baseline for followed categories
            
    # Fetch last 200 interactions (more history = better personalization)
    cursor = interactions_col.find({"userId": user_id}).sort("timestamp", -1).limit(200)
    interactions = await cursor.to_list(length=200)
    
    content_ids = [i["contentId"] for i in interactions]
    content_docs = await content_col.find({"_id": {"$in": content_ids}}).to_list(length=len(content_ids))
    content_map = {c["_id"]: c for c in content_docs}
    
    # Apply recency decay to interactions — recent likes matter more
    now = datetime.utcnow()
    for interact in interactions:
        c_id = interact["contentId"]
        action = interact["actionType"]
        weight = INTERACTION_WEIGHTS.get(action, 0.0)
        
        # Recency decay on interaction: recent interactions count more
        ts = interact.get("timestamp") or now
        if isinstance(ts, str):
            try:
                ts = datetime.fromisoformat(ts.replace("Z", "+00:00"))
            except Exception:
                ts = now
        elif not isinstance(ts, datetime):
            ts = now
        age_hours = max(0.0, (now - ts).total_seconds() / 3600.0)
        # Decay: full weight in first 24h, halved at 72h, quartered at 168h (1 week)
        import math
        recency_multiplier = 1.0 / (1.0 + math.log1p(age_hours / 24.0))
        weight *= recency_multiplier
        
        # Dwell time scaling for view actions
        dwell_time = interact.get("dwell_time") or interact.get("dwellTime") or 0.0
        if action == "view" and dwell_time > 0:
            weight = weight * (1.0 + math.log1p(dwell_time))
            
        content_item = content_map.get(c_id)
        if content_item:
            cat = content_item.get("category")
            if cat in cat_scores:
                cat_scores[cat] += weight
                
    # Keep scores non-negative
    for cat in cat_scores:
        cat_scores[cat] = max(0.0, cat_scores[cat])
        
    # Normalize to sum to 1.0
    total_score = sum(cat_scores.values())
    interests = {}
    if total_score > 0:
        interests = {cat: round(score / total_score, 4) for cat, score in cat_scores.items() if score > 0}
    else:
        interests = {}
        
    await users_col.update_one(
        {"_id": user_id},
        {"$set": {"interests": interests}}
    )
    logger.info(f"Updated interest profile for user {user_id}: {interests}")
    return interests


async def get_personalized_recommendations(user_id: Optional[str], limit: int = 20, skip: int = 0) -> List[Dict[str, Any]]:
    """
    Instagram-style personalized feed:
    - User's interest profile drives HOW MANY items from each category appear
    - 60% interest in Tech → ~60% of the feed is Tech
    - Within each category, items are ranked by recency + popularity
    - New users (no interactions) get a diversity-first feed
    
    Formula per item: score = (0.60 * interest) + (0.25 * popularity) + (0.12 * recency) + (0.03 * noise)
    """
    content_col = get_collection("content")
    users_col = get_collection("users")
    
    all_content = await content_col.find({}).to_list(length=2000)
    if not all_content:
        return []
        
    # Load user interests
    user_interests = {}
    has_interactions = False
    if user_id:
        user_doc = await users_col.find_one({"_id": user_id})
        if user_doc:
            user_interests = user_doc.get("interests", {})
            has_interactions = bool(user_interests)
    
    # ── New / No-interaction user: return diversified feed (same as guest) ──
    if not has_interactions:
        import random
        from collections import defaultdict
        by_cat = defaultdict(list)
        for item in all_content:
            by_cat[item.get("category", "Other")].append(item)
        for cat in by_cat:
            by_cat[cat].sort(key=lambda x: (x.get("likes", 0) * 3 + x.get("saves", 0) * 5 + x.get("views", 0)), reverse=True)
        cats = list(by_cat.keys())
        random.shuffle(cats)
        interleaved = []
        max_r = max(len(v) for v in by_cat.values()) if by_cat else 0
        for r in range(max_r):
            for cat in cats:
                if r < len(by_cat[cat]):
                    interleaved.append(by_cat[cat][r])
        return interleaved[skip:skip + limit]

    # ── Logged-in user with interaction history ──
    import random
    from collections import defaultdict
    now = datetime.utcnow()

    # Score every item
    raw_pops = []
    for c in all_content:
        raw_pop = (c.get("views", 0) * 1.0) + (c.get("likes", 0) * 3.0) + \
                  (c.get("saves", 0) * 5.0) + (c.get("shares", 0) * 2.0)
        c["_raw_pop"] = raw_pop
        raw_pops.append(raw_pop)
    
    pop_min = min(raw_pops) if raw_pops else 0
    pop_max = max(raw_pops) if raw_pops else 0
    pop_range = max(pop_max - pop_min, 1.0)

    for c in all_content:
        cat = c.get("category")
        interest = user_interests.get(cat, 0.0)
        popularity = (c["_raw_pop"] - pop_min) / pop_range

        created_at = c.get("created_at") or now
        if isinstance(created_at, str):
            try:
                created_at = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
            except Exception:
                created_at = now
        age_days = max(0.0, (now - created_at).total_seconds() / 86400.0)
        recency = 1.0 / (1.0 + age_days)

        noise = random.uniform(0.0, 1.0)
        # Instagram-style: interest is the DOMINANT signal
        c["_rec_score"] = (0.60 * interest) + (0.25 * popularity) + (0.12 * recency) + (0.03 * noise)

    # ── Interest-proportional slot allocation ──
    # If user is 60% Tech, allocate ~60% of the page to Tech items
    # This is how Instagram/TikTok actually work
    
    # Group by category, sorted by score within each group
    by_cat = defaultdict(list)
    for c in all_content:
        by_cat[c.get("category", "Other")].append(c)
    for cat in by_cat:
        by_cat[cat].sort(key=lambda x: x["_rec_score"], reverse=True)

    # Calculate slot allocation per category based on user interest
    total_interest = sum(user_interests.get(cat, 0.0) for cat in by_cat)
    
    # Guarantee at least 1 slot for ALL categories so feed isn't 100% one category
    # Max any single category can take is 70% of the page
    cat_slots: Dict[str, int] = {}
    allocated = 0
    
    # Full pool size we're drawing from (pagination-aware)
    pool_size = limit + skip  # need enough items to skip + return limit
    
    for cat in by_cat:
        if total_interest > 0:
            interest_ratio = user_interests.get(cat, 0.0) / total_interest
            # Cap: dominant category gets at most 70% of slots, min 1 slot
            slots = max(1, round(interest_ratio * pool_size * 1.3))
            slots = min(slots, int(pool_size * 0.70))
        else:
            slots = max(1, pool_size // max(1, len(by_cat)))
        cat_slots[cat] = slots
    
    # Build the personalized pool by taking `slots` best items from each category
    pool = []
    for cat, items_in_cat in by_cat.items():
        slots = cat_slots.get(cat, 1)
        pool.extend(items_in_cat[:slots])
    
    # Final sort by score — items with high interest AND high popularity win
    pool.sort(key=lambda x: x["_rec_score"], reverse=True)
    
    # Paginate
    return pool[skip:skip + limit]
