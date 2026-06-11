import os
import json
import asyncio
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

logger = logging.getLogger("uvicorn")

# --- Persistent JSON-based Mock Database fallback for development convenience ---
class MockCursor:
    def __init__(self, data: List[Dict[str, Any]], sort_key: Optional[str] = None, sort_dir: int = -1, limit_val: Optional[int] = None, skip_val: int = 0):
        self._data = data
        if sort_key:
            self._data = sorted(
                self._data, 
                key=lambda x: x.get(sort_key, 0) if x.get(sort_key) is not None else "",
                reverse=(sort_dir == -1)
            )
        self._skip = skip_val
        self._limit = limit_val
        self._index = 0

    def sort(self, key: str, direction: int = -1):
        return MockCursor(self._data, sort_key=key, sort_dir=direction, limit_val=self._limit, skip_val=self._skip)

    def limit(self, count: int):
        return MockCursor(self._data, sort_key=None, limit_val=count, skip_val=self._skip)

    def skip(self, count: int):
        return MockCursor(self._data, sort_key=None, limit_val=self._limit, skip_val=count)

    async def to_list(self, length: Optional[int] = None) -> List[Dict[str, Any]]:
        await asyncio.sleep(0.01)  # Simulate async I/O latency
        start = self._skip
        end = start + (length or len(self._data))
        if self._limit is not None:
            end = min(end, start + self._limit)
        return self._data[start:end]

    def __aiter__(self):
        return self

    async def __anext__(self):
        await asyncio.sleep(0.005)
        # Apply slice if iterating directly
        sliced = self._data[self._skip:]
        if self._limit is not None:
            sliced = sliced[:self._limit]
            
        if self._index >= len(sliced):
            raise StopAsyncIteration
        val = sliced[self._index]
        self._index += 1
        return val


class MockCollection:
    def __init__(self, db_path: str, collection_name: str):
        self.file_path = os.path.join(db_path, f"{collection_name}.json")
        self.collection_name = collection_name
        self._ensure_file()

    def _ensure_file(self):
        if not os.path.exists(self.file_path):
            with open(self.file_path, "w") as f:
                json.dump([], f, indent=2)

    def _serialize_helper(self, obj: Any) -> Any:
        if isinstance(obj, dict):
            return {k: self._serialize_helper(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [self._serialize_helper(i) for i in obj]
        elif isinstance(obj, datetime):
            return obj.isoformat()
        return obj

    def _deserialize_helper(self, obj: Any) -> Any:
        if isinstance(obj, dict):
            new_dict = {}
            for k, v in obj.items():
                if isinstance(v, str) and (k.endswith("_at") or k == "timestamp" or k == "generatedAt" or k == "created_at"):
                    try:
                        new_dict[k] = datetime.fromisoformat(v)
                    except Exception:
                        new_dict[k] = v
                else:
                    new_dict[k] = self._deserialize_helper(v)
            return new_dict
        elif isinstance(obj, list):
            return [self._deserialize_helper(i) for i in obj]
        return obj

    def _read(self) -> List[Dict[str, Any]]:
        try:
            with open(self.file_path, "r") as f:
                data = json.load(f)
                return self._deserialize_helper(data)
        except Exception:
            return []

    def _write(self, data: List[Dict[str, Any]]):
        try:
            serialized_data = self._serialize_helper(data)
            with open(self.file_path, "w") as f:
                json.dump(serialized_data, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to write to mock db: {e}")

    def _matches(self, doc: Dict[str, Any], query: Dict[str, Any]) -> bool:
        if not query:
            return True
        for key, val in query.items():
            if isinstance(val, dict):
                # Simple implementation of basic operators like $in or $ne
                doc_val = doc.get(key)
                if "$in" in val:
                    if doc_val not in val["$in"]:
                        return False
                elif "$ne" in val:
                    if doc_val == val["$ne"]:
                        return False
                elif "$gt" in val:
                    if not (doc_val is not None and doc_val > val["$gt"]):
                        return False
                elif "$lt" in val:
                    if not (doc_val is not None and doc_val < val["$lt"]):
                        return False
            else:
                if doc.get(key) != val:
                    return False
        return True

    async def find_one(self, query: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        await asyncio.sleep(0.01)
        data = self._read()
        for doc in data:
            if self._matches(doc, query):
                return doc
        return None

    def find(self, query: Dict[str, Any] = None) -> MockCursor:
        query = query or {}
        data = self._read()
        matches = [doc for doc in data if self._matches(doc, query)]
        return MockCursor(matches)

    async def insert_one(self, document: Dict[str, Any]) -> Any:
        await asyncio.sleep(0.01)
        data = self._read()
        doc_copy = dict(document)
        if "_id" not in doc_copy:
            import uuid
            doc_copy["_id"] = str(uuid.uuid4())
        data.append(doc_copy)
        self._write(data)
        
        # Mock class for insert result
        class InsertResult:
            inserted_id = doc_copy["_id"]
        return InsertResult()

    async def update_one(self, query: Dict[str, Any], update: Dict[str, Any], upsert: bool = False) -> Any:
        await asyncio.sleep(0.01)
        data = self._read()
        matched = False
        
        # Parse $set or direct update
        set_fields = update.get("$set", {})
        inc_fields = update.get("$inc", {})
        
        for doc in data:
            if self._matches(doc, query):
                matched = True
                for k, v in set_fields.items():
                    doc[k] = v
                for k, v in inc_fields.items():
                    doc[k] = doc.get(k, 0) + v
                break
                
        if not matched and upsert:
            # Construct a basic document combining query and set_fields
            new_doc = {**query, **set_fields}
            if "_id" not in new_doc:
                import uuid
                new_doc["_id"] = str(uuid.uuid4())
            data.append(new_doc)
            self._write(data)
        elif matched:
            self._write(data)
            
        class UpdateResult:
            matched_count = 1 if matched else 0
            modified_count = 1 if matched else 0
        return UpdateResult()

    async def delete_one(self, query: Dict[str, Any]) -> Any:
        await asyncio.sleep(0.01)
        data = self._read()
        index_to_delete = -1
        for idx, doc in enumerate(data):
            if self._matches(doc, query):
                index_to_delete = idx
                break
        deleted = False
        if index_to_delete != -1:
            data.pop(index_to_delete)
            self._write(data)
            deleted = True
            
        class DeleteResult:
            deleted_count = 1 if deleted else 0
        return DeleteResult()

    async def count_documents(self, query: Dict[str, Any]) -> int:
        await asyncio.sleep(0.005)
        data = self._read()
        return sum(1 for doc in data if self._matches(doc, query))

    async def distinct(self, key: str, query: Optional[Dict[str, Any]] = None) -> List[Any]:
        await asyncio.sleep(0.01)
        query = query or {}
        data = self._read()
        unique_vals = set()
        for doc in data:
            if self._matches(doc, query):
                val = doc.get(key)
                if val is not None:
                    if isinstance(val, list):
                        for item in val:
                            unique_vals.add(item)
                    else:
                        unique_vals.add(val)
        return list(unique_vals)


class MockDatabase:
    def __init__(self, db_path: str):
        self.db_path = db_path
        os.makedirs(db_path, exist_ok=True)
        self._collections: Dict[str, MockCollection] = {}

    def get_collection(self, name: str) -> MockCollection:
        if name not in self._collections:
            self._collections[name] = MockCollection(self.db_path, name)
        return self._collections[name]

    def __getitem__(self, name: str) -> MockCollection:
        return self.get_collection(name)


class MockDatabaseClient:
    def __init__(self, db_path: str):
        self.db_path = db_path

    def get_database(self, name: str) -> MockDatabase:
        return MockDatabase(os.path.join(self.db_path, name))

    def __getitem__(self, name: str) -> MockDatabase:
        return self.get_database(name)


# --- Database Initialization ---

db_client = None
db = None
is_mock_db = False

async def init_db():
    global db_client, db, is_mock_db
    
    # Try connecting to real MongoDB
    if settings.MONGODB_URL:
        try:
            logger.info(f"Connecting to MongoDB at {settings.MONGODB_URL}...")
            # Set a 3 second timeout for connection verification
            client = AsyncIOMotorClient(settings.MONGODB_URL, serverSelectionTimeoutMS=3000)
            # Trigger a simple command to verify connection
            await client.admin.command('ping')
            db_client = client
            db = client[settings.DATABASE_NAME]
            is_mock_db = False
            logger.info("Successfully connected to MongoDB.")
            return
        except Exception as e:
            logger.warning(f"MongoDB connection failed: {e}. Falling back to persistent Mock JSON Database...")
            
    # Fallback to Mock JSON DB inside the backend directory
    mock_db_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".mock_db"))
    db_client = MockDatabaseClient(mock_db_dir)
    db = db_client[settings.DATABASE_NAME]
    is_mock_db = True
    logger.info(f"Initialized persistent mock database in: {mock_db_dir}")

def get_collection(collection_name: str):
    if db is None:
        # If DB not initialized synchronously yet (e.g. at import time), get it dynamically
        # Since we initialized global variables, it'll return once init_db() is called.
        mock_db_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".mock_db"))
        return MockDatabaseClient(mock_db_dir)[settings.DATABASE_NAME][collection_name]
    return db[collection_name]
