import uuid
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field

from app.database import get_collection
from app.routers.auth import get_current_user, check_rate_limit
from app.services.recommendation import VALID_CATEGORIES

logger = logging.getLogger("uvicorn")
router = APIRouter(prefix="/api/messages", tags=["messages"])

class MessageCreate(BaseModel):
    recipient_id: str = Field(..., description="ID of the recipient user or 'pixora-ai-bot'")
    message_text: str = Field(..., min_length=1, max_length=1000, description="Content of the message")

class MessageOut(BaseModel):
    id: str = Field(alias="_id")
    sender_id: str
    recipient_id: str
    message_text: str
    timestamp: datetime

    class Config:
        populate_by_name = True

@router.get("/contacts", dependencies=[Depends(check_rate_limit)])
async def get_chat_contacts(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Returns a list of potential chat contacts, consisting of the Pixora AI Assistant bot
    and all other registered users in the database.
    """
    users_col = get_collection("users")
    
    # Get all users except current user
    all_users = await users_col.find({"_id": {"$ne": current_user["_id"]}}).to_list(length=100)
    
    contacts = [
        {
            "id": "pixora-ai-bot",
            "name": "Pixora AI Assistant",
            "email": "ai-assistant@pixora.com",
            "is_bot": True,
            "avatar_emoji": "🤖",
            "bio": "Ask me about your recommendations, category weights, or how the feed works!"
        }
    ]
    
    for u in all_users:
        contacts.append({
            "id": u["_id"],
            "name": u["name"],
            "email": u["email"],
            "is_bot": False,
            "avatar_emoji": "👤",
            "bio": "Pixora community member"
        })
        
    return contacts

@router.get("/{recipient_id}", response_model=List[MessageOut], dependencies=[Depends(check_rate_limit)])
async def get_message_history(
    recipient_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Returns chronological message history between the current user and the specified recipient_id.
    """
    messages_col = get_collection("messages")
    user_id = current_user["_id"]
    
    # Query messages where current user is sender and recipient_id is recipient OR vice versa
    query = {
        "$or": [
            {"sender_id": user_id, "recipient_id": recipient_id},
            {"sender_id": recipient_id, "recipient_id": user_id}
        ]
    }
    
    cursor = messages_col.find(query).sort("timestamp", 1)
    messages = await cursor.to_list(length=500)
    
    # Convert _id keys to string representation for Pydantic mapping
    for m in messages:
        m["id"] = m["_id"]
        
    # If it is a new chat with the bot, insert an initial welcome message
    if recipient_id == "pixora-ai-bot" and len(messages) == 0:
        welcome_msg = {
            "_id": "welcome-bot-msg",
            "sender_id": "pixora-ai-bot",
            "recipient_id": user_id,
            "message_text": f"Hi {current_user['name']}! 👋 I am the Pixora AI Assistant. I can help analyze your feed weights, explore categories, or explain the recommendation algorithm. How can I help you today?",
            "timestamp": datetime.utcnow()
        }
        await messages_col.insert_one(welcome_msg)
        welcome_msg["id"] = welcome_msg["_id"]
        messages.append(welcome_msg)
        
    return messages

@router.post("", response_model=MessageOut, dependencies=[Depends(check_rate_limit)])
async def send_message(
    payload: MessageCreate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Sends a message to a recipient. If the recipient is the AI bot, triggers an immediate automated reply.
    """
    messages_col = get_collection("messages")
    user_id = current_user["_id"]
    
    msg_id = str(uuid.uuid4())
    new_message = {
        "_id": msg_id,
        "sender_id": user_id,
        "recipient_id": payload.recipient_id,
        "message_text": payload.message_text,
        "timestamp": datetime.utcnow()
    }
    
    await messages_col.insert_one(new_message)
    new_message["id"] = msg_id
    
    # Trigger AI Bot response if chatting with the bot
    if payload.recipient_id == "pixora-ai-bot":
        bot_reply_text = generate_bot_reply(payload.message_text, current_user)
        
        bot_msg_id = str(uuid.uuid4())
        bot_message = {
            "_id": bot_msg_id,
            "sender_id": "pixora-ai-bot",
            "recipient_id": user_id,
            "message_text": bot_reply_text,
            "timestamp": datetime.utcnow()
        }
        await messages_col.insert_one(bot_message)
        
    return new_message

def generate_bot_reply(user_msg: str, user: Dict[str, Any]) -> str:
    """
    Analyzes user text keywords and responds intelligently regarding Pixora recommendation rules.
    """
    text = user_msg.lower()
    user_name = user["name"]
    followed = user.get("followed_categories", [])
    interests = user.get("interests", {})
    
    # 1. Ask about recommendation algorithm
    if any(k in text for k in ["algorithm", "formula", "score", "how it works", "ranking", "how do you rank"]):
        return (
            f"Great question, {user_name}! 🧮 Pixora ranks feed content using a hybrid scoring formula:\n\n"
            "   Score = (0.5 * Interest Match) + (0.3 * Popularity) + (0.2 * Recency)\n\n"
            "• Interest Match (50%): Calculated from your followed categories and dynamic interactions (views, likes, saves).\n"
            "• Popularity (30%): Normalized globally based on content view, like, and save counts.\n"
            "• Recency (20%): Time decay factor ensuring new, fresh items appear near the top of your scroll."
        )
        
    # 2. Ask about user's own interests / profile
    elif any(k in text for k in ["my interests", "my profile", "my categories", "what do I like", "my dna"]):
        if not interests:
            return (
                f"Hey {user_name}, you don't have any interaction history recorded yet! "
                f"You currently follow: {', '.join(followed) if followed else 'no categories yet'}. "
                "Try browsing the feed, liking posts, or saving them to build your dynamic interest profile! 📈"
            )
        
        sorted_interests = sorted(interests.items(), key=lambda x: x[1], reverse=True)
        affinity_list = "\n".join([f"• {cat}: {round(wt*100, 1)}%" for cat, wt in sorted_interests if wt > 0])
        return (
            f"Here is your current recommendation interest DNA profile, {user_name}: 🧬\n\n"
            f"{affinity_list}\n\n"
            "Every action you take (views, likes, saves) immediately recalculates these percentages!"
        )
        
    # 3. Ask about categories
    elif any(k in text for k in ["categories", "topics", "what categories", "valid categories"]):
        cats_str = ", ".join(VALID_CATEGORIES)
        return (
            f"Pixora currently supports the following content categories: 🏷️\n\n"
            f"{cats_str}\n\n"
            "You can click on any category circle in the home screen header to filter your feed by that topic."
        )
        
    # 4. Ask about dwell time / watch history
    elif any(k in text for k in ["dwell", "watch time", "duration", "dwell time"]):
        return (
            "Dwell time is an implicit engagement signal! ⏱️ When you view a card for a long duration, "
            "Pixora registers this. The view weight is scaled using a logarithmic helper: "
            "weight * (1 + ln(1 + dwell_time)). This prevents short views from dropping off, while "
            "ensuring long views strongly influence your interest profile without skewing it too heavily!"
        )
        
    # 5. Ask for content recommendation / what to look at
    elif any(k in text for k in ["recommend", "what should i watch", "suggest", "any recommendation"]):
        if interests:
            top_cat = max(interests.items(), key=lambda x: x[1])[0]
            return (
                f"Based on your dynamic profile, your top interest is *{top_cat}*! 🌟 "
                f"I suggest filtering the feed by clicking on the *{top_cat}* circle at the top of your screen, "
                "or exploring the 'Explore' tab to find globally trending visual ideas."
            )
        elif followed:
            return (
                f"Since you follow *{followed[0]}*, I highly recommend exploring items in that category! "
                "Try liking a few posts to let the algorithm refine your profile. 📈"
            )
        else:
            return "Try browsing the globally trending feed (by clicking 'Explore' in the sidebar) to discover new topics, then follow your favorite categories!"
            
    # 6. Basic greetings
    elif any(k in text for k in ["hi", "hello", "hey", "hola", "greetings", "wassup"]):
        return (
            f"Hello {user_name}! 👋 Hope you are having a great day. "
            "Ask me anything about how your recommendation feed is generated, or what your current interest weights look like!"
        )
        
    # Default fallback
    return (
        f"I'm here to help, {user_name}! 🤖 I can explain how the recommendation algorithm scores candidates, "
        "analyze your interest DNA, or outline the dynamic category system. "
        "Try asking me: 'How does the recommendation algorithm work?' or 'What are my interests?'"
    )
