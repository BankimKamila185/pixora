# Pixora - Personalized Recommendation Feed System

Pixora is a full-stack college practical exam project that demonstrates how a modern social media recommendation feed can be designed, implemented, and evaluated. The project includes a user-facing feed, an admin analytics dashboard, a FastAPI backend, content ingestion support, authentication, interaction tracking, and a dynamic recommendation engine.

The main objective of Pixora is to show how user activity such as views, likes, saves, comments, shares, and dwell time can be converted into an interest profile and then used to rank feed content in real time.

## Project Summary

| Item | Details |
| --- | --- |
| Project Name | Pixora |
| Domain | Personalized image feed and recommendation system |
| Project Type | College practical exam / case study project |
| Architecture | Full-stack web application |
| Backend | FastAPI, Python, MongoDB |
| Frontend | Next.js, React |
| Database | MongoDB with local JSON fallback support |
| Main Users | Normal user and admin/curator |
| Core Feature | Interest-based personalized feed ranking |

## Key Features

- User registration and login with JWT authentication.
- Onboarding flow where users select preferred content categories.
- Personalized "For You" feed based on user interests.
- Trending feed for popular and high-engagement content.
- Interaction tracking for views, likes, saves, shares, comments, and watch time.
- Dynamic recommendation score calculation using interest, popularity, recency, and exploration noise.
- Admin dashboard for content monitoring, analytics, and recommendation inspection.
- Activity simulation tool for testing how user interactions affect recommendations.
- Content ingestion support from image APIs and Google Drive.
- Case study documentation for system design and scalability discussion.

## System Architecture

Pixora is divided into three main applications:

```text
Pixora
├── backend/          FastAPI backend API and recommendation engine
├── frontend-user/    User-facing Next.js feed application
├── frontend-admin/   Admin dashboard and analytics application
└── CASE_STUDY_DESIGN.md
```

### Architecture Flow

```text
User App / Admin App
        |
        v
FastAPI Backend
        |
        +-- Auth Router
        +-- Content Router
        +-- Admin Router
        +-- Message Router
        |
        v
Recommendation and Ingestion Services
        |
        v
MongoDB / Local JSON Fallback
```

## Recommendation Logic

Pixora builds a user interest profile from both explicit and implicit actions.

### Interaction Signals

| Action | Meaning | Weight Type |
| --- | --- | --- |
| View | User opened or saw a post | Weak implicit signal |
| Watch / Dwell Time | User spent time on content | Stronger implicit signal |
| Like | User liked a post | Explicit positive signal |
| Save | User bookmarked a post | Very strong positive signal |
| Share | User shared a post | Positive distribution signal |
| Comment | User engaged deeply | Strong explicit signal |

### Feed Score

Each content item is ranked using a combined score:

```text
Final Score =
  Interest Match Score
  + Popularity Score
  + Recency Score
  + Exploration Noise
```

This makes the feed personal while still keeping it fresh and diverse.

## Main Modules

### Backend

- `app/main.py` - FastAPI application entry point.
- `app/routers/auth.py` - Login, registration, and authentication routes.
- `app/routers/content.py` - Feed, content, likes, saves, comments, and watch tracking routes.
- `app/routers/admin.py` - Admin analytics, ingestion, and simulation routes.
- `app/services/recommendation.py` - Core recommendation and interest-profile logic.
- `app/services/ingestion.py` - External image/content ingestion logic.
- `app/database.py` - MongoDB connection and fallback database handling.

### User Frontend

- Home feed with personalized and trending content.
- Login, register, and onboarding pages.
- Profile page showing saved posts, liked posts, and category activity.
- Dwell-time tracking using viewport visibility.

### Admin Frontend

- System overview and analytics.
- Content ingestion controls.
- Recommendation inspection by user.
- Activity simulation for testing personalization changes.

## Tech Stack

### Backend

- Python
- FastAPI
- Uvicorn
- Motor / PyMongo
- Pydantic
- JWT authentication

### Frontend

- Next.js
- React
- Tailwind CSS
- Framer Motion
- Lucide React icons
- Recharts for admin charts

### Database

- MongoDB
- Local JSON fallback database for development/demo resilience

## Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/BankimKamila185/pixora.git
cd pixora
```

### 2. Backend Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Backend API:

```text
http://127.0.0.1:8000
```

Swagger API Docs:

```text
http://127.0.0.1:8000/docs
```

### 3. User Frontend Setup

Open a new terminal:

```bash
cd frontend-user
npm install
npm run dev
```

User app:

```text
http://localhost:3000
```

### 4. Admin Frontend Setup

Open another terminal:

```bash
cd frontend-admin
npm install
npm run dev -- -p 3001
```

Admin app:

```text
http://localhost:3001
```

## Environment Variables

The backend can run with default local settings. Optional API keys can be added in `backend/.env`.

```env
MONGODB_URL=mongodb://127.0.0.1:27017/pixora
DATABASE_NAME=pixora
JWT_SECRET_KEY=your_secret_key

UNSPLASH_ACCESS_KEY=
PEXELS_API_KEY=
GOOGLE_DRIVE_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=
GOOGLE_ACCESS_TOKEN=
```

## How to Demonstrate the Project

1. Start the backend server.
2. Start the user frontend.
3. Register a new user.
4. Select interests during onboarding.
5. Interact with feed posts by liking, saving, opening, and watching them.
6. Open the admin dashboard.
7. Inspect the same user's recommendation profile.
8. Simulate additional activity from the admin panel.
9. Refresh the user feed and observe how recommendations change.

## Practical Exam Evaluation Points

- Demonstrates full-stack development using backend, frontend, and database integration.
- Shows a working recommendation system instead of only static content.
- Uses real interaction events to update user interests.
- Includes admin analytics and inspection tools for explainability.
- Shows practical API design using FastAPI routes and Swagger docs.
- Handles scalability concepts in `CASE_STUDY_DESIGN.md`.
- Supports future improvements such as caching, streaming pipelines, and machine learning ranking models.

## Testing

A focused recommendation test file is available:

```bash
python3 backend/test_recommendations.py
```

If dependencies are missing, install backend requirements first:

```bash
cd backend
pip install -r requirements.txt
```

## Case Study Document

The file `CASE_STUDY_DESIGN.md` contains a detailed explanation of:

- Requirements analysis.
- System architecture.
- Recommendation algorithm.
- Database design.
- Scalability and fault tolerance.
- Security considerations.

This document can be used as supporting material for the college practical exam submission.

## Future Scope

- Add Redis caching for faster feed delivery.
- Add Kafka or Pub/Sub for large-scale interaction event processing.
- Add machine learning based collaborative filtering.
- Add image moderation and duplicate detection.
- Add deployment configuration for cloud hosting.
- Add more automated unit and integration tests.

## Conclusion

Pixora is a complete practical implementation of a personalized recommendation feed system. It combines user interaction tracking, content ranking, analytics, authentication, and system design documentation into one project suitable for college evaluation and demonstration.
