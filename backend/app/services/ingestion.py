import logging
import uuid
import httpx
from datetime import datetime
from typing import List, Dict, Any
from app.config import settings
from app.database import get_collection
from app.services.recommendation import VALID_CATEGORIES

logger = logging.getLogger("uvicorn")

async def ingest_unsplash_images(query: str, category: str, count: int) -> List[Dict[str, Any]]:
    """
    Fetches images from Unsplash API for the given query and maps them to our schema.
    Falls back to curated Unsplash image URLs if access key is not set.
    """
    if not settings.UNSPLASH_ACCESS_KEY:
        logger.info("Unsplash Access Key not set. Using curated mock ingestion...")
        return get_mock_unsplash_images(query, category, count)

    url = "https://api.unsplash.com/search/photos"
    headers = {"Authorization": f"Client-ID {settings.UNSPLASH_ACCESS_KEY}"}
    params = {"query": query, "per_page": count, "orientation": "squarish"}

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers, params=params, timeout=10.0)
            if response.status_code != 200:
                logger.error(f"Unsplash API error: {response.status_code} - {response.text}")
                return get_mock_unsplash_images(query, category, count)
                
            data = response.json()
            results = data.get("results", [])
            
            items = []
            for img in results:
                # Map to our content format
                title = img.get("description") or img.get("alt_description") or f"Beautiful {query}"
                title = title.capitalize()[:100]
                
                desc = img.get("alt_description") or f"A high-quality visual capture representing {query}."
                desc = desc.capitalize()
                
                # Tags: extract from tags list if present, else search query
                tags = [t.get("title").lower() for t in img.get("tags", []) if t.get("title")]
                if not tags:
                    tags = query.lower().split()
                
                items.append({
                    "_id": str(uuid.uuid4()),
                    "title": title,
                    "description": desc,
                    "image_url": img["urls"]["regular"],
                    "category": category,
                    "source": "Unsplash",
                    "tags": tags[:6],
                    "likes": 0,
                    "saves": 0,
                    "views": 0,
                    "shares": 0,
                    "created_at": datetime.utcnow()
                })
            return items
        except Exception as e:
            logger.error(f"Unsplash ingestion request failed: {e}")
            return get_mock_unsplash_images(query, category, count)


async def ingest_pexels_images(query: str, category: str, count: int) -> List[Dict[str, Any]]:
    """
    Fetches images from Pexels API. Falls back to curated mock images if key is not set.
    """
    if not settings.PEXELS_API_KEY:
        logger.info("Pexels API Key not set. Using curated mock ingestion...")
        return get_mock_unsplash_images(query, category, count)

    url = "https://api.pexels.com/v1/search"
    headers = {"Authorization": settings.PEXELS_API_KEY}
    params = {"query": query, "per_page": count, "size": "medium"}

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers, params=params, timeout=10.0)
            if response.status_code != 200:
                logger.error(f"Pexels API error: {response.status_code} - {response.text}")
                return get_mock_unsplash_images(query, category, count)
                
            data = response.json()
            photos = data.get("photos", [])
            
            items = []
            for photo in photos:
                title = f"{query.capitalize()} study by {photo.get('photographer')}"
                desc = f"Professional photography of {query} captured by {photo.get('photographer')} on Pexels."
                
                items.append({
                    "_id": str(uuid.uuid4()),
                    "title": title,
                    "description": desc,
                    "image_url": photo["src"]["medium"],
                    "category": category,
                    "source": "Pexels",
                    "tags": query.lower().split(),
                    "likes": 0,
                    "saves": 0,
                    "views": 0,
                    "shares": 0,
                    "created_at": datetime.utcnow()
                })
            return items
        except Exception as e:
            logger.error(f"Pexels ingestion request failed: {e}")
            return get_mock_unsplash_images(query, category, count)


def get_mock_unsplash_images(query: str, category: str, count: int) -> List[Dict[str, Any]]:
    """
    Generates high-quality Unsplash image URLs using dynamic source links 
    so the app remains fully functional and visual without requiring API credentials.
    """
    items = []
    # Base keywords to pick images from dynamically
    words = query.lower().split()
    keyword = words[0] if words else "inspiration"
    
    # We use a collection of Unsplash photo IDs that are beautiful and generic
    photo_ids = [
        "photo-1470071459604-3b5ec3a7fe05", "photo-1433832597046-4f10e10ac764",
        "photo-1501854140801-50d01698950b", "photo-1555066931-4365d14bab8c",
        "photo-1558494949-ef010cbdcc31", "photo-1509440159596-0249088772ff",
        "photo-1592417817098-8f3d6eb19675", "photo-1533105079780-92b9be482077",
        "photo-1507525428034-b723cf961d3e", "photo-1586023492125-27b2c045efd7",
        "photo-1620712943543-bcc4688e7485", "photo-1507842217343-583bb7270b66",
        "photo-1495707902641-75cac588d2e9", "photo-1518005020951-eccb494ad742"
    ]
    
    for i in range(count):
        # Pick a photo id cyclically
        p_id = photo_ids[i % len(photo_ids)]
        # Unsplash Source URL structure matching the search query
        image_url = f"https://images.unsplash.com/{p_id}?w=800&auto=format&fit=crop&q=80&sig={i+5}"
        
        items.append({
            "_id": str(uuid.uuid4()),
            "title": f"Dynamic {query.capitalize()} Inspiration {i+1}",
            "description": f"A beautiful image exploring {query} keywords, curated for the {category} feed.",
            "image_url": image_url,
            "category": category,
            "source": "Unsplash",
            "tags": [keyword, "discovery", "visual"],
            "likes": 0,
            "saves": 0,
            "views": 0,
            "shares": 0,
            "created_at": datetime.utcnow()
        })
    return items


# --- Google Drive Ingestion Integrations ---

import os
import csv
import json
import io

async def ingest_google_drive_folder(
    folder_id: str, 
    category: str, 
    count: int, 
    api_key: str = None, 
    access_token: str = None
) -> List[Dict[str, Any]]:
    """
    Lists files inside a Google Drive folder and maps them to Content schemas.
    Direct download link: https://drive.google.com/uc?export=download&id={file_id}
    """
    if not api_key and not access_token:
        if settings.GOOGLE_DRIVE_API_KEY:
            api_key = settings.GOOGLE_DRIVE_API_KEY
        else:
            logger.info("Google Drive credentials not provided. Simulating folder import...")
            return get_mock_drive_folder_images(folder_id, category, count)

    url = "https://www.googleapis.com/drive/v3/files"
    q_str = f"'{folder_id}' in parents and mimeType contains 'image/' and trashed = false"
    params = {
        "q": q_str,
        "pageSize": count,
        "fields": "files(id, name, description)",
    }
    headers = {}
    if access_token:
        headers["Authorization"] = f"Bearer {access_token}"
    elif api_key:
        params["key"] = api_key

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers, params=params, timeout=12.0)
            if response.status_code != 200:
                logger.error(f"Google Drive folder API error: {response.status_code} - {response.text}")
                return get_mock_drive_folder_images(folder_id, category, count)

            data = response.json()
            files = data.get("files", [])
            items = []
            
            for file in files:
                f_id = file.get("id")
                name = file.get("name", f"Drive Asset {f_id}")
                title = os.path.splitext(name)[0].replace("-", " ").replace("_", " ").capitalize()
                desc = file.get("description") or f"Google Drive asset '{name}' imported into the {category} catalog."
                image_url = f"https://drive.google.com/uc?export=download&id={f_id}"
                
                items.append({
                    "_id": str(uuid.uuid4()),
                    "title": title[:100],
                    "description": desc,
                    "image_url": image_url,
                    "category": category,
                    "source": "Google Drive",
                    "tags": ["drive", "imported", category.lower()],
                    "likes": 0,
                    "saves": 0,
                    "views": 0,
                    "shares": 0,
                    "created_at": datetime.utcnow()
                })
            return items
        except Exception as e:
            logger.error(f"Google Drive folder request failed: {e}")
            return get_mock_drive_folder_images(folder_id, category, count)


async def ingest_google_drive_file(
    file_id: str, 
    category: str, 
    api_key: str = None, 
    access_token: str = None
) -> List[Dict[str, Any]]:
    """
    Downloads and parses a CSV or JSON catalog file from Google Drive.
    CSV schema expects columns: title, description, image_url, [tags]
    """
    if not api_key and not access_token:
        if settings.GOOGLE_DRIVE_API_KEY:
            api_key = settings.GOOGLE_DRIVE_API_KEY
        else:
            logger.info("Google Drive credentials not provided. Simulating file import...")
            return get_mock_drive_file_catalog(file_id, category)

    url = f"https://www.googleapis.com/drive/v3/files/{file_id}"
    params = {"alt": "media"}
    headers = {}
    if access_token:
        headers["Authorization"] = f"Bearer {access_token}"
    elif api_key:
        params["key"] = api_key

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers, params=params, timeout=12.0)
            if response.status_code != 200:
                logger.error(f"Google Drive file download error: {response.status_code} - {response.text}")
                return get_mock_drive_file_catalog(file_id, category)

            content_text = response.text
            items = []
            
            # Detect JSON vs CSV
            if file_id.endswith(".json") or content_text.strip().startswith("[") or content_text.strip().startswith("{"):
                try:
                    data = json.loads(content_text)
                    if isinstance(data, dict):
                        data = [data]
                    for obj in data:
                        title = obj.get("title", "Imported drive item").capitalize()
                        desc = obj.get("description", "Imported from Google Drive catalog file.")
                        img_url = obj.get("image_url") or obj.get("imageUrl")
                        tags = obj.get("tags")
                        if isinstance(tags, str):
                            tags = [t.strip() for t in tags.split(",") if t]
                        elif not isinstance(tags, list):
                            tags = ["drive"]
                            
                        if img_url:
                            items.append({
                                "_id": str(uuid.uuid4()),
                                "title": title[:100],
                                "description": desc,
                                "image_url": img_url,
                                "category": category,
                                "source": "Google Drive",
                                "tags": tags[:6],
                                "likes": 0,
                                "saves": 0,
                                "views": 0,
                                "shares": 0,
                                "created_at": datetime.utcnow()
                            })
                except Exception as je:
                    logger.error(f"JSON parsing failed for Drive file: {je}")
                    return get_mock_drive_file_catalog(file_id, category)
            else:
                # Parse as CSV
                f_stream = io.StringIO(content_text)
                reader = csv.DictReader(f_stream)
                for row in reader:
                    title = row.get("title", "Imported Drive Asset").capitalize()
                    desc = row.get("description", "A catalog item imported from Google Drive CSV.")
                    img_url = row.get("image_url") or row.get("imageUrl")
                    tags_str = row.get("tags", "")
                    tags = [t.strip().lower() for t in tags_str.split(",") if t.strip()] if tags_str else ["drive"]
                    
                    if img_url:
                        items.append({
                            "_id": str(uuid.uuid4()),
                            "title": title[:100],
                            "description": desc,
                            "image_url": img_url,
                            "category": category,
                            "source": "Google Drive",
                            "tags": tags[:6],
                            "likes": 0,
                            "saves": 0,
                            "views": 0,
                            "shares": 0,
                            "created_at": datetime.utcnow()
                        })
            return items
        except Exception as e:
            logger.error(f"Google Drive file import failed: {e}")
            return get_mock_drive_file_catalog(file_id, category)


def get_mock_drive_folder_images(folder_id: str, category: str, count: int) -> List[Dict[str, Any]]:
    items = []
    photo_ids = [
        "photo-1542038784456-1ea8e935640e", "photo-1500964757637-c85e8a162699",
        "photo-1490730141103-6cac27aaab94", "photo-1476480862126-209bfaa8edc8",
        "photo-1544367567-0f2fcb009e0b", "photo-1517838277536-f5f99be501cd",
        "photo-1553530666-ba11a7da3888", "photo-1470071459604-3b5ec3a7fe05",
        "photo-1433832597046-4f10e10ac764", "photo-1501854140801-50d01698950b"
    ]
    for i in range(count):
        p_id = photo_ids[i % len(photo_ids)]
        img_url = f"https://images.unsplash.com/{p_id}?w=800&auto=format&fit=crop&q=80&sig={i+20}"
        items.append({
            "_id": str(uuid.uuid4()),
            "title": f"Google Drive Image_{i+1:02d}.jpg",
            "description": f"Curated visual asset simulated from Google Drive folder '{folder_id}', matching the {category} category.",
            "image_url": img_url,
            "category": category,
            "source": "Google Drive",
            "tags": ["gdrive", "folder-import", category.lower()],
            "likes": 0,
            "saves": 0,
            "views": 0,
            "shares": 0,
            "created_at": datetime.utcnow()
        })
    return items


def get_mock_drive_file_catalog(file_id: str, category: str) -> List[Dict[str, Any]]:
    items = []
    catalog_data = [
        {
            "title": "Starry Night Horizon",
            "description": "Simulation item representing a star-studded sky overlooking a silhouetted pine tree ridge.",
            "p_id": "photo-1506318137071-a8e063b4bec0"
        },
        {
            "title": "Minimalist Workspace Desk",
            "description": "Simulation item showing an ultra-clean desk with a laptop, succulent plant, and a ceramic tea mug.",
            "p_id": "photo-1499750310107-5fef28a66643"
        },
        {
            "title": "Gourmet Avocado Toast Platter",
            "description": "Simulation item with thick sourdough, poached eggs, red chili flakes, and microgreens.",
            "p_id": "photo-1541532713592-79a0317b6b77"
        },
        {
            "title": "Exploring Alpine Ridges Track",
            "description": "Simulation item capturing a hiker looking down at a vast glacial valley high in the Alps.",
            "p_id": "photo-1464822759023-fed622ff2c3b"
        },
        {
            "title": "Creative Abstract Liquid Marble",
            "description": "Simulation item depicting macro fluid art swirls blending royal blue and copper gold pigments.",
            "p_id": "photo-1541701494587-cb58502866ab"
        }
    ]
    for idx, obj in enumerate(catalog_data):
        img_url = f"https://images.unsplash.com/{obj['p_id']}?w=800&auto=format&fit=crop&q=80&sig={idx+40}"
        items.append({
            "_id": str(uuid.uuid4()),
            "title": obj["title"],
            "description": obj["description"],
            "image_url": img_url,
            "category": category,
            "source": "Google Drive",
            "tags": ["gdrive", "csv-catalog", category.lower()],
            "likes": 0,
            "saves": 0,
            "views": 0,
            "shares": 0,
            "created_at": datetime.utcnow()
        })
    return items
