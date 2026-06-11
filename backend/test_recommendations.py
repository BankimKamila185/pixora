import asyncio
import os
import sys

# Add backend directory to path to enable imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import init_db, get_collection
from app.services.recommendation import update_user_interest_profile, get_personalized_recommendations

async def run_test():
    print("--------------------------------------------------")
    print("RUNNING RECO SYSTEM ALGORITHM VERIFICATION")
    print("--------------------------------------------------")
    
    # Initialize DB (forces MockDB setup if MongoDB is offline)
    await init_db()
    
    users_col = get_collection("users")
    content_col = get_collection("content")
    interactions_col = get_collection("interactions")
    
    # Clean up test records
    await users_col.delete_one({"_id": "test-user-id"})
    await content_col.delete_one({"_id": "test-nature-content"})
    await content_col.delete_one({"_id": "test-tech-content"})
    while True:
        res = await interactions_col.delete_one({"userId": "test-user-id"})
        if res.deleted_count == 0:
            break
    
    # 1. Create a test user
    print("[1] Creating test user with initial followed categories...")
    test_user = {
        "_id": "test-user-id",
        "name": "Beta Tester",
        "email": "tester@example.com",
        "password_hash": "hash",
        "interests": {},
        "followed_categories": ["Nature"],
        "created_at": None
    }
    await users_col.insert_one(test_user)
    
    # 2. Create test content
    print("[2] Creating Nature and Technology test content...")
    nature_content = {
        "_id": "test-nature-content",
        "title": "Beautiful Green Trees",
        "description": "Just nature and leaf details.",
        "image_url": "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
        "category": "Nature",
        "tags": ["green", "trees"],
        "views": 10,
        "likes": 2,
        "saves": 1,
        "shares": 0
    }
    tech_content = {
        "_id": "test-tech-content",
        "title": "Ultrawide LED Monitor setup",
        "description": "Code display on large screen.",
        "image_url": "https://images.unsplash.com/photo-1555066931-4365d14bab8c",
        "category": "Technology",
        "tags": ["led", "monitor"],
        "views": 100,  # Highly popular, should pull higher popular score
        "likes": 40,
        "saves": 30,
        "shares": 10
    }
    await content_col.insert_one(nature_content)
    await content_col.insert_one(tech_content)
    
    # 3. Calculate initial interest profile
    print("[3] Calculating initial interest profile (based on followed categories)...")
    interests = await update_user_interest_profile("test-user-id")
    print(f"    Calculated user interests: {interests}")
    assert interests.get("Nature", 0) == 1.0, "Initial profile should favor followed category 'Nature' 100%!"
    
    # 4. Generate recommendations
    print("[4] Generating recommendations...")
    recos = await get_personalized_recommendations("test-user-id", limit=5)
    print(f"    Recommended order: {[r['title'] for r in recos]}")
    # The nature content should be ranked higher due to 100% interest matching weight (0.5 * 1.0 vs 0.5 * 0.0)
    assert recos[0]["_id"] == "test-nature-content", "Nature content should be ranked first due to Interest Match weight!"
    print("    Assertion passed: Nature content ranked first.")
    
    # 5. Log interaction to change interests
    print("[5] Injecting Technology interactions (likes/saves) to shift user interest profile...")
    # Add a view, like, and save for Tech
    import uuid
    for action in ["view", "like", "save"]:
        interact = {
            "_id": str(uuid.uuid4()),
            "userId": "test-user-id",
            "contentId": "test-tech-content",
            "actionType": action,
            "timestamp": None
        }
        await interactions_col.insert_one(interact)
        
    # Recalculate
    new_interests = await update_user_interest_profile("test-user-id")
    print(f"    Shifted user interests: {new_interests}")
    # Tech score should now be non-zero
    assert new_interests.get("Technology", 0) > 0, "Technology interest score should be greater than zero after interaction!"
    print("    Assertion passed: Tech interest score increased.")
    
    # Clean up test records
    await users_col.delete_one({"_id": "test-user-id"})
    await content_col.delete_one({"_id": "test-nature-content"})
    await content_col.delete_one({"_id": "test-tech-content"})
    
    # We delete many in interactions matching test-user-id
    try:
        await interactions_col.delete_many({"userId": "test-user-id"})
    except Exception:
        await interactions_col.delete_one({"userId": "test-user-id"})
        
    print("\n[SUCCESS] ALL RECO SERVICES VERIFIED SUCCESSFULLY!")
    print("--------------------------------------------------")

if __name__ == "__main__":
    asyncio.run(run_test())
