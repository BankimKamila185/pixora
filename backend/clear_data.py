import asyncio
import logging
from app.database import init_db, get_collection
from app.services.recommendation import update_user_interest_profile

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("clear_data")

async def main():
    logger.info("Connecting to database...")
    await init_db()

    content_col = get_collection("content")
    interactions_col = get_collection("interactions")
    users_col = get_collection("users")

    logger.info("Wiping content collection...")
    content_res = await content_col.delete_many({})
    logger.info(f"Deleted {content_res.deleted_count} content items.")

    logger.info("Wiping user interactions history...")
    interactions_res = await interactions_col.delete_many({})
    logger.info(f"Deleted {interactions_res.deleted_count} interactions.")

    logger.info("Resetting interest profile on existing users...")
    users = await users_col.find({}).to_list(length=1000)
    for user in users:
        u_id = user["_id"]
        # Reset interests dictionary to empty
        await users_col.update_one(
            {"_id": u_id},
            {"$set": {"interests": {}}}
        )
        logger.info(f"Reset interests for user: {user.get('email')}")

    logger.info("Database cleared of all mock catalog data successfully!")

if __name__ == "__main__":
    asyncio.run(main())
