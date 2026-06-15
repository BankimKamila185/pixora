import json
import os

db_path = "/Users/bankimkamila/Pixora/backend/.mock_db/pixora/content.json"
if os.path.exists(db_path):
    with open(db_path, "r") as f:
        items = json.load(f)
    
    # Filter out mock Google Drive items (those pointing to unsplash instead of local proxy)
    filtered = []
    purged_count = 0
    for item in items:
        if item.get("source") == "Google Drive" and item.get("image_url", "").startswith("https://images.unsplash.com"):
            purged_count += 1
            continue
        filtered.append(item)
        
    with open(db_path, "w") as f:
        json.dump(filtered, f, indent=2)
        
    print(f"Successfully purged {purged_count} mock Google Drive items from JSON database!")
else:
    print("Database path not found.")
