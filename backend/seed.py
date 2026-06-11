import asyncio
import uuid
import logging
from datetime import datetime, timedelta
from app.database import init_db, get_collection
from app.services.recommendation import VALID_CATEGORIES

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("seed")

# Curated high-quality Unsplash image URLs and metadata for the 9 categories
SEED_CONTENT = [
    # --- Nature ---
    {
        "title": "Misty Pine Forests of the Pacific Northwest",
        "description": "A quiet morning capture of fog rolling over evergreen forests in Oregon. The deep green tones and calm atmosphere bring nature's peace right to your screen.",
        "image_url": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80",
        "category": "Nature",
        "tags": ["misty", "forest", "mountains", "fog", "oregon", "green"],
        "views": 420, "likes": 128, "saves": 94, "shares": 34
    },
    {
        "title": "Golden Hour in Yosemite Valley",
        "description": "The sun setting behind El Capitan, casting a warm golden glow across the valley floor and reflections in the Merced River.",
        "image_url": "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=800&auto=format&fit=crop&q=80",
        "category": "Nature",
        "tags": ["yosemite", "national park", "sunset", "climbing", "river"],
        "views": 612, "likes": 204, "saves": 115, "shares": 45
    },
    {
        "title": "Glacial Blue Ice Caves",
        "description": "Stepping inside an ancient glacier cave in Iceland, where light filters through thick blue ice to create an otherworldly atmosphere.",
        "image_url": "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&auto=format&fit=crop&q=80",
        "category": "Nature",
        "tags": ["iceland", "glacier", "ice cave", "adventure", "blue"],
        "views": 380, "likes": 110, "saves": 82, "shares": 19
    },
    {
        "title": "Serene Mountain Lake Reflection",
        "description": "Crisp morning air and glass-like water reflecting the snowcapped peaks of the Canadian Rockies at Moraine Lake.",
        "image_url": "https://images.unsplash.com/photo-1433832597046-4f10e10ac764?w=800&auto=format&fit=crop&q=80",
        "category": "Nature",
        "tags": ["moraine", "canada", "reflection", "turquoise", "lake"],
        "views": 530, "likes": 185, "saves": 140, "shares": 52
    },
    {
        "title": "Autumn Pathways in Kyoto",
        "description": "Vibrant red and orange maple leaves arching over a stone pathway leading to a historic temple in Kyoto, Japan.",
        "image_url": "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&auto=format&fit=crop&q=80",
        "category": "Nature",
        "tags": ["kyoto", "japan", "autumn", "foliage", "temple", "leaves"],
        "views": 290, "likes": 95, "saves": 70, "shares": 18
    },

    # --- Technology ---
    {
        "title": "Minimalist Developer Setup",
        "description": "An ultra-clean workspace featuring a mechanical keyboard, ultrawide monitor, ambient warm lighting, and a dark terminal environment.",
        "image_url": "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80",
        "category": "Technology",
        "tags": ["workspace", "developer", "setup", "minimalist", "code", "keyboard"],
        "views": 850, "likes": 320, "saves": 250, "shares": 98
    },
    {
        "title": "Server Infrastructure Rack Detail",
        "description": "Deep blue and violet LED indicators glowing on high-performance network switchboards inside a modern cloud computing data center.",
        "image_url": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80",
        "category": "Technology",
        "tags": ["datacenter", "servers", "network", "cloud", "hosting", "blue"],
        "views": 390, "likes": 105, "saves": 78, "shares": 22
    },
    {
        "title": "Futuristic VR Interface Exploration",
        "description": "Engaging with advanced spatial computing user interfaces using a lightweight head-mounted virtual reality display.",
        "image_url": "https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=800&auto=format&fit=crop&q=80",
        "category": "Technology",
        "tags": ["virtual reality", "spatial computing", "vr", "future", "ar"],
        "views": 470, "likes": 160, "saves": 120, "shares": 50
    },
    {
        "title": "Cyberpunk Neon City Circuit Board",
        "description": "Macro photography of an intricate motherboard highlighted by electric pink and cyan fluorescent light leaks.",
        "image_url": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80",
        "category": "Technology",
        "tags": ["cyberpunk", "motherboard", "hardware", "neon", "electronics"],
        "views": 590, "likes": 215, "saves": 143, "shares": 64
    },
    {
        "title": "Writing Clean Python Code",
        "description": "Close up shot of a coder writing object-oriented Python scripts in VS Code, optimized for backend microservices.",
        "image_url": "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=800&auto=format&fit=crop&q=80",
        "category": "Technology",
        "tags": ["coding", "python", "software engineer", "dev", "vscode"],
        "views": 720, "likes": 270, "saves": 190, "shares": 75
    },

    # --- Recipes ---
    {
        "title": "Homemade Sourdough Boule",
        "description": "An artisanal loaf of sourdough fresh out of the oven, showing off a perfectly blistered crust, scored design, and airy crumb structure.",
        "image_url": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80",
        "category": "Recipes",
        "tags": ["sourdough", "baking", "bread", "artisan", "carbs", "yeast"],
        "views": 620, "likes": 240, "saves": 310, "shares": 80
    },
    {
        "title": "Fresh Tomato & Basil Caprese Salad",
        "description": "A vibrant summer classic with heirloom tomato slices, buffalo mozzarella, fresh basil leaves, and a drizzle of aged balsamic glaze.",
        "image_url": "https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?w=800&auto=format&fit=crop&q=80",
        "category": "Recipes",
        "tags": ["salad", "italian", "caprese", "healthy", "fresh", "basil"],
        "views": 410, "likes": 130, "saves": 180, "shares": 45
    },
    {
        "title": "Decadent Double Chocolate Brownies",
        "description": "Ultra fudgy brownies loaded with chocolate chunks, dusted with sea salt flakes, and photographed with a molten chocolate drizzle.",
        "image_url": "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&auto=format&fit=crop&q=80",
        "category": "Recipes",
        "tags": ["chocolate", "brownies", "dessert", "baking", "sweet", "fudge"],
        "views": 890, "likes": 390, "saves": 490, "shares": 160
    },
    {
        "title": "Creamy Vegan Coconut Curry",
        "description": "An easy 30-minute yellow curry packed with sweet potato cubes, chickpeas, spinach, and garnished with fresh cilantro and lime wedges.",
        "image_url": "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800&auto=format&fit=crop&q=80",
        "category": "Recipes",
        "tags": ["curry", "vegan", "coconut", "dinner", "spicy", "chickpeas"],
        "views": 530, "likes": 195, "saves": 280, "shares": 95
    },
    {
        "title": "Traditional Japanese Ramen Bowl",
        "description": "Rich pork tonkotsu broth served with wavy noodles, chashu pork belly, a soft-boiled soy-marinated egg, nori, and scallions.",
        "image_url": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop&q=80",
        "category": "Recipes",
        "tags": ["ramen", "japanese", "noodles", "soup", "tonkotsu", "egg"],
        "views": 750, "likes": 305, "saves": 380, "shares": 110
    },

    # --- Travel ---
    {
        "title": "Sunset Over Santorini Caldera",
        "description": "Classic whitewashed houses and blue-domed churches clinging to the cliffs of Oia, looking out onto the Aegean Sea at dusk.",
        "image_url": "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&auto=format&fit=crop&q=80",
        "category": "Travel",
        "tags": ["greece", "santorini", "oia", "sunset", "island", "ocean"],
        "views": 940, "likes": 380, "saves": 290, "shares": 120
    },
    {
        "title": "Turquoise Lagoons of Bora Bora",
        "description": "Overwater bungalows hovering over crystal clear coral reefs under a bright tropical sky in French Polynesia.",
        "image_url": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80",
        "category": "Travel",
        "tags": ["bora bora", "tropics", "beach", "bungalow", "luxury", "island"],
        "views": 810, "likes": 325, "saves": 240, "shares": 85
    },
    {
        "title": "Wandering Through Petra's Siq",
        "description": "The dramatic sandstone canyon path leading to the iconic facade of Al-Khazneh (The Treasury) in Petra, Jordan.",
        "image_url": "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=800&auto=format&fit=crop&q=80",
        "category": "Travel",
        "tags": ["jordan", "petra", "history", "canyon", "ancient", "wonder"],
        "views": 490, "likes": 170, "saves": 130, "shares": 40
    },
    {
        "title": "Alpine Train Ride in Switzerland",
        "description": "A bright red Bernina Express passenger train crossing a high stone viaduct enveloped by snowcapped peaks and green valleys.",
        "image_url": "https://images.unsplash.com/photo-1531310197839-ccf54634509e?w=800&auto=format&fit=crop&q=80",
        "category": "Travel",
        "tags": ["switzerland", "alps", "train", "scenic", "mountains", "red"],
        "views": 670, "likes": 260, "saves": 210, "shares": 72
    },
    {
        "title": "Colorful Streets of Amalfi",
        "description": "Boats docked in a harbor with steep mountainside cliffs decorated by pastel-painted buildings in Positano, Italy.",
        "image_url": "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=800&auto=format&fit=crop&q=80",
        "category": "Travel",
        "tags": ["amalfi", "positano", "italy", "coast", "summer", "harbor"],
        "views": 760, "likes": 295, "saves": 235, "shares": 88
    },

    # --- Design ---
    {
        "title": "Mid-Century Modern Living Room",
        "description": "A stylish, curated living space featuring an Eames lounge chair, teak wooden sideboard, houseplants, and warm abstract wall art.",
        "image_url": "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&auto=format&fit=crop&q=80",
        "category": "Design",
        "tags": ["interior design", "mid-century", "furniture", "living room", "minimalist"],
        "views": 580, "likes": 210, "saves": 270, "shares": 65
    },
    {
        "title": "Geometric Poster Graphic Layout",
        "description": "An inspiring print design showcase using Swiss typography, bold circular geometries, and a vibrant primary color palette.",
        "image_url": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
        "category": "Design",
        "tags": ["graphic design", "poster", "typography", "swiss", "geometry", "art"],
        "views": 430, "likes": 150, "saves": 195, "shares": 54
    },
    {
        "title": "Architectural Concrete Spirals",
        "description": "Looking directly up a winding spiral staircase constructed of raw cast concrete inside a brutalist art gallery.",
        "image_url": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80",
        "category": "Design",
        "tags": ["architecture", "concrete", "staircase", "minimal", "brutalist"],
        "views": 360, "likes": 115, "saves": 140, "shares": 28
    },
    {
        "title": "Mobile App UI Interaction Design",
        "description": "Sleek user interface templates highlighting neumorphism buttons, glassmorphic cards, and smooth screen transition logic.",
        "image_url": "https://images.unsplash.com/photo-1541462608143-67571c6738dd?w=800&auto=format&fit=crop&q=80",
        "category": "Design",
        "tags": ["ui/ux", "product design", "wireframe", "app", "mobile", "sketch"],
        "views": 690, "likes": 245, "saves": 310, "shares": 92
    },
    {
        "title": "Moody Japandi Bedroom Design",
        "description": "The perfect blend of Japanese minimalism and Scandinavian warmth, featuring a low platform bed, linen sheets, and bamboo accents.",
        "image_url": "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&auto=format&fit=crop&q=80",
        "category": "Design",
        "tags": ["bedroom", "japandi", "wabi-sabi", "scandinavian", "plants"],
        "views": 490, "likes": 180, "saves": 220, "shares": 40
    },

    # --- Artificial Intelligence ---
    {
        "title": "Neural Network Node Connections",
        "description": "Visualizing deep learning architecture through glowing nodes, dense synapses, and backpropagation pathways in three dimensions.",
        "image_url": "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&auto=format&fit=crop&q=80",
        "category": "Artificial Intelligence",
        "tags": ["neural networks", "machine learning", "nodes", "graph", "ai", "math"],
        "views": 780, "likes": 280, "saves": 190, "shares": 80
    },
    {
        "title": "Futuristic Cybernetic Cyborg Hand",
        "description": "A close up look at a robotic hand interacting with a biological human touch, symbolizing collaboration between carbon and silicon.",
        "image_url": "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop&q=80",
        "category": "Artificial Intelligence",
        "tags": ["robotics", "cyborg", "future", "bionic", "engineering"],
        "views": 520, "likes": 190, "saves": 110, "shares": 45
    },
    {
        "title": "Generative Art Neural Landscapes",
        "description": "abstract topography maps generated entirely using algorithmic noise models and convolutional autoencoders.",
        "image_url": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
        "category": "Artificial Intelligence",
        "tags": ["generative", "neural art", "gan", "creative coding", "abstract"],
        "views": 410, "likes": 135, "saves": 102, "shares": 30
    },
    {
        "title": "Large Language Model Word Embeddings",
        "description": "A high-dimensional vector plot illustrating semantic relationships, token weights, and attention clusters in LLM decoders.",
        "image_url": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80",
        "category": "Artificial Intelligence",
        "tags": ["nlp", "transformers", "vectors", "embeddings", "attention"],
        "views": 640, "likes": 220, "saves": 165, "shares": 58
    },
    {
        "title": "Smart City Autonomous Traffic Flow",
        "description": "AI systems coordinating public transport, self-driving shuttles, and traffic routing to optimize commute times dynamically.",
        "image_url": "https://images.unsplash.com/photo-1508921912186-1d1a45ebb3c1?w=800&auto=format&fit=crop&q=80",
        "category": "Artificial Intelligence",
        "tags": ["smart city", "autonomous", "routing", "iot", "urbanism"],
        "views": 460, "likes": 150, "saves": 105, "shares": 33
    },

    # --- Education ---
    {
        "title": "Historic University Library Aisles",
        "description": "Tall wooden bookshelves stacked with vintage leatherbound volumes under leaded glass windows in an ivy league library.",
        "image_url": "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=800&auto=format&fit=crop&q=80",
        "category": "Education",
        "tags": ["library", "books", "studying", "academia", "vintage", "campus"],
        "views": 510, "likes": 180, "saves": 210, "shares": 48
    },
    {
        "title": "Handwritten Quantum Physics Formulas",
        "description": "Chalkboard equations outlining Schrodinger's wave equations, matrix mechanics, and atomic energy states.",
        "image_url": "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop&q=80",
        "category": "Education",
        "tags": ["physics", "chalkboard", "math", "formulas", "quantum", "science"],
        "views": 390, "likes": 125, "saves": 155, "shares": 29
    },
    {
        "title": "Focused Student Homework Desk",
        "description": "Studying late with notebook notations, open textbook, highlighter pens, and a hot mug of coffee under a desk lamp.",
        "image_url": "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=80",
        "category": "Education",
        "tags": ["study", "exams", "desk", "coffee", "writing", "focus"],
        "views": 630, "likes": 220, "saves": 280, "shares": 52
    },
    {
        "title": "Creative Science Experiment Beakers",
        "description": "Vibrant colored chemical indicators reacting inside clean glass flasks in an active chemistry research laboratory.",
        "image_url": "https://images.unsplash.com/photo-1532187863486-abf9d39d66e8?w=800&auto=format&fit=crop&q=80",
        "category": "Education",
        "tags": ["chemistry", "lab", "science", "beaker", "experiment"],
        "views": 440, "likes": 145, "saves": 110, "shares": 24
    },
    {
        "title": "Interactive Virtual Classroom Learning",
        "description": "High school students participating in immersive spatial geometry modules using desktop augmented reality monitors.",
        "image_url": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80",
        "category": "Education",
        "tags": ["elearning", "classroom", "technology", "interactive", "edtech"],
        "views": 320, "likes": 95, "saves": 85, "shares": 15
    },

    # --- Photography ---
    {
        "title": "Classic Analog SLR Camera detail",
        "description": "Macro capture showing off mechanical dials, copper lens threads, and prism glass on a vintage 1970s film camera.",
        "image_url": "https://images.unsplash.com/photo-1495707902641-75cac588d2e9?w=800&auto=format&fit=crop&q=80",
        "category": "Photography",
        "tags": ["camera", "analog", "vintage", "lens", "film", "slr"],
        "views": 680, "likes": 260, "saves": 220, "shares": 74
    },
    {
        "title": "Long Exposure Neon Light Trails",
        "description": "Traffic trails zooming beneath towering skyscrapers in the heart of Tokyo at night, illustrating urban energy.",
        "image_url": "https://images.unsplash.com/photo-1518005020951-eccb494ad742?w=800&auto=format&fit=crop&q=80",
        "category": "Photography",
        "tags": ["long exposure", "tokyo", "night", "neon", "traffic", "light"],
        "views": 840, "likes": 340, "saves": 260, "shares": 105
    },
    {
        "title": "Moody Portrait Golden Glow Light Leaks",
        "description": "Creative portrait photography playing with natural light flares, prism refractions, and high contrast shadow masks.",
        "image_url": "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800&auto=format&fit=crop&q=80",
        "category": "Photography",
        "tags": ["portrait", "prism", "light leak", "golden hour", "bokeh"],
        "views": 490, "likes": 185, "saves": 140, "shares": 41
    },
    {
        "title": "Dramatic Drone View of Coastal Cliffs",
        "description": "Waves crashing onto black sand volcanic beaches along the southern coast of Iceland, captured from a vertical perspective.",
        "image_url": "https://images.unsplash.com/photo-1500964757637-c85e8a162699?w=800&auto=format&fit=crop&q=80",
        "category": "Photography",
        "tags": ["drone", "coast", "cliffs", "aerial", "ocean", "iceland"],
        "views": 720, "likes": 290, "saves": 205, "shares": 83
    },
    {
        "title": "Macro Water Droplet Refractions",
        "description": "A close up look at perfect dew droplets on a dandelion seed, reflecting the colors of a flower field background.",
        "image_url": "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=800&auto=format&fit=crop&q=80",
        "category": "Photography",
        "tags": ["macro", "water droplet", "refraction", "nature", "details"],
        "views": 370, "likes": 115, "saves": 98, "shares": 19
    },

    # --- Fitness ---
    {
        "title": "Crisp Morning Jog on Suspension Bridge",
        "description": "A runner maintaining their stride across a suspension bridge shrouded in early morning river mist.",
        "image_url": "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&auto=format&fit=crop&q=80",
        "category": "Fitness",
        "tags": ["running", "jogging", "bridge", "morning", "cardio", "health"],
        "views": 690, "likes": 230, "saves": 190, "shares": 55
    },
    {
        "title": "Sunset Vinyasa Yoga Flow",
        "description": "Perfect warrior pose alignment silhouetted against a calm beach sunset, demonstrating balance and core stability.",
        "image_url": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&auto=format&fit=crop&q=80",
        "category": "Fitness",
        "tags": ["yoga", "vinyasa", "balance", "beach", "sunset", "stretching"],
        "views": 540, "likes": 195, "saves": 225, "shares": 68
    },
    {
        "title": "Heavy Barbell Deadlift Effort",
        "description": "An athlete lifting heavy weights in a gritty warehouse gym, focusing on strength, posture, and intense dedication.",
        "image_url": "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80",
        "category": "Fitness",
        "tags": ["powerlifting", "deadlift", "gym", "barbell", "heavy", "weights"],
        "views": 820, "likes": 310, "saves": 180, "shares": 92
    },
    {
        "title": "Healthy Pre-Workout Green Smoothie",
        "description": "Spinach, banana, chia seeds, and protein powder blended into a jar, surrounded by fresh kitchen ingredients.",
        "image_url": "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=800&auto=format&fit=crop&q=80",
        "category": "Fitness",
        "tags": ["smoothie", "protein", "healthy", "preworkout", "nutrition"],
        "views": 470, "likes": 140, "saves": 240, "shares": 47
    },
    {
        "title": "HIIT Training Battle Rope Wave",
        "description": "An intense high-intensity interval workout featuring battle ropes on a turf gym floor, training speed and muscular endurance.",
        "image_url": "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80",
        "category": "Fitness",
        "tags": ["hiit", "battle ropes", "gym", "cardio", "athletic", "endurance"],
        "views": 590, "likes": 195, "saves": 150, "shares": 40
    }
]

async def seed_database():
    logger.info("Initializing database...")
    await init_db()
    
    content_col = get_collection("content")
    interactions_col = get_collection("interactions")
    users_col = get_collection("users")
    
    # 1. Clear existing content
    logger.info("Clearing existing database tables...")
    await content_col.delete_one({"_id": {"$ne": ""}}) # deletes in mock-db
    await interactions_col.delete_one({"_id": {"$ne": ""}})
    await users_col.delete_one({"_id": {"$ne": ""}})
    
    # For actual MongoDB compatibility, we drop or call delete_many
    try:
        await content_col.delete_many({})
        await interactions_col.delete_many({})
        await users_col.delete_many({})
    except Exception:
        # Expected in mock DB where delete_many is handled via fallback delete_one or not needed
        pass

    logger.info(f"Seeding {len(SEED_CONTENT)} curated content items...")
    
    now = datetime.utcnow()
    
    # Insert content
    content_ids = []
    for item in SEED_CONTENT:
        c_id = str(uuid.uuid4())
        content_ids.append(c_id)
        
        # Distribute created_at timestamps slightly to show realistic timeline recency decay
        age_days = len(content_ids) % 10  # 0 to 9 days old
        created_time = now - timedelta(days=age_days, hours=age_days * 2)
        
        doc = {
            "_id": c_id,
            "title": item["title"],
            "description": item["description"],
            "image_url": item["image_url"],
            "category": item["category"],
            "tags": item["tags"],
            "likes": item["likes"],
            "saves": item["saves"],
            "views": item["views"],
            "shares": item["shares"],
            "created_at": created_time
        }
        await content_col.insert_one(doc)
        
    logger.info("Content seeded successfully.")

    # 2. Seed some demo users with specific interests
    demo_users = [
        {
            "_id": "user-nature-tech",
            "name": "Sarah Miller",
            "email": "sarah@example.com",
            "password_hash": "$2b$12$R9hZqR/2e.s8b6f7h8i9jOuC/K1eMv7p9m8w7z6o5i4u3y2t1r0qS", # mock bcrypt hash for 'password123'
            "interests": {"Nature": 0.55, "Technology": 0.35, "Travel": 0.10},
            "followed_categories": ["Nature", "Technology", "Travel"],
            "created_at": now - timedelta(days=20)
        },
        {
            "_id": "user-recipes-design",
            "name": "Alex Chen",
            "email": "alex@example.com",
            "password_hash": "$2b$12$R9hZqR/2e.s8b6f7h8i9jOuC/K1eMv7p9m8w7z6o5i4u3y2t1r0qS",
            "interests": {"Recipes": 0.60, "Design": 0.30, "Photography": 0.10},
            "followed_categories": ["Recipes", "Design"],
            "created_at": now - timedelta(days=15)
        },
        {
            "_id": "user-fitness-ai",
            "name": "Emma Watson",
            "email": "emma@example.com",
            "password_hash": "$2b$12$R9hZqR/2e.s8b6f7h8i9jOuC/K1eMv7p9m8w7z6o5i4u3y2t1r0qS",
            "interests": {"Fitness": 0.45, "Artificial Intelligence": 0.40, "Education": 0.15},
            "followed_categories": ["Fitness", "Artificial Intelligence"],
            "created_at": now - timedelta(days=8)
        }
    ]
    
    logger.info(f"Seeding {len(demo_users)} demo users...")
    for user in demo_users:
        await users_col.insert_one(user)
        
    # 3. Seed some initial interaction logs to show activity charts
    logger.info("Seeding user interaction history...")
    
    # Let's generate 40 interactions for the demo users across seeded content
    # Mix of views, likes, and saves spread over the last 5 days
    import random
    actions = ["view", "like", "save"]
    action_weights = [0.6, 0.25, 0.15]
    
    interaction_count = 0
    for u in demo_users:
        u_id = u["_id"]
        # Find some content IDs matching their favorite categories
        favs = list(u["interests"].keys())
        # Filter content from database that matches these categories
        matching_content = [item for item in SEED_CONTENT if item["category"] in favs]
        
        # Let's write interactions
        for i in range(12):
            c_meta = random.choice(matching_content)
            # Find the actual seeded content ID by matching title
            cursor = content_col.find({"title": c_meta["title"]})
            res = await cursor.to_list(length=1)
            if not res:
                continue
            c_id = res[0]["_id"]
            
            action = random.choices(actions, weights=action_weights, k=1)[0]
            timestamp = now - timedelta(days=random.randint(0, 5), hours=random.randint(1, 23))
            
            interaction = {
                "_id": str(uuid.uuid4()),
                "userId": u_id,
                "contentId": c_id,
                "actionType": action,
                "timestamp": timestamp
            }
            await interactions_col.insert_one(interaction)
            interaction_count += 1
            
    logger.info(f"Seeded {interaction_count} interaction items. Database Seeding Completed Successfully!")

if __name__ == "__main__":
    asyncio.run(seed_database())
