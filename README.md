# SocialMind AI 🚀

> AI-powered Social Media Manager SaaS built with React, FastAPI, Gemini AI, SQLite, and JWT Authentication.

---

## 🌟 Overview

SocialMind AI is a full-stack production-ready SaaS that helps brands create, schedule, and manage social media content automatically using cutting-edge AI. The system uses a LangGraph agentic pipeline with RAG (Retrieval-Augmented Generation) to generate brand-aware, platform-optimized content for Instagram, LinkedIn, Twitter, and Facebook.

---

## 🎨 Design

- Dark theme (`#0a0a0f` / `#0d0d1a`) with Electric Violet (`#7c3aed`) + Cyan (`#06b6d4`) accents
- Glassmorphism cards with backdrop blur
- Smooth Framer Motion animations
- "Syne" headings + "Inter" body text
- Gradient mesh backgrounds + floating glowing orbs

---

## 📁 Project Structure

```
socialmind/
├── backend/              # FastAPI Python backend
│   ├── main.py           # Entry point + WebSocket
│   ├── agents/
│   │   ├── social_agent.py   # LangGraph agent pipeline
│   │   ├── rag_pipeline.py   # Pinecone RAG ingestion/retrieval
│   │   └── tools.py          # Agent helper tools
│   ├── routers/          # API route handlers
│   ├── models/           # SQLAlchemy ORM models
│   ├── schemas/          # Pydantic validation schemas
│   ├── core/             # Config, security, deps, websocket manager
│   ├── db/               # Database engine + session
│   └── requirements.txt
│
└── frontend/             # React 18 + Vite frontend
    └── src/
        ├── pages/        # All 9 pages (Landing → Settings)
        ├── components/   # UI + Layout components
        ├── store/        # Zustand state management
        ├── hooks/        # useWebSocket
        ├── services/     # Axios API client
        └── App.jsx       # Router configuration
```

---

## ⚙️ Setup & Running

### Backend

```bash
cd backend

# Copy env (edit with real API keys for production)
cp .env.example .env

# Install dependencies
pip install -r requirements.txt

# Start server (SQLite used by default — no PostgreSQL needed locally)
python -m uvicorn main:app --reload --port 8000
```

Backend runs at: **http://localhost:8000**  
API docs: **http://localhost:8000/docs**

### Frontend

```bash
cd frontend

# Install dependencies
npm install --legacy-peer-deps

# Start dev server
npm run dev
```

Frontend runs at: **http://localhost:5173**

---

## 🔑 Environment Variables

### Backend (`.env`)

```env
# Local SQLite (default — no setup needed)
DATABASE_URL=sqlite:///./socialmind.db

# For production — switch to PostgreSQL:
# DATABASE_URL=postgresql://user:password@localhost:5432/socialmind

# OpenAI (required for AI generation)
OPENAI_API_KEY=sk-your-openai-api-key

# Pinecone (required for RAG — brand context retrieval)
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_INDEX_NAME=socialmind

# JWT
JWT_SECRET_KEY=your-super-secret-key-change-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_DAYS=7
```

### Frontend (`.env`)

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

---

## 🤖 AI Agent Pipeline

The LangGraph agent runs a 5-node pipeline for each content generation request:

```
START
  ↓
fetch_brand_context_node   → Retrieves brand voice from Pinecone RAG
  ↓
analyze_competitors_node   → Retrieves competitor content patterns
  ↓
generate_content_node      → GPT-4o generates platform-specific posts
  ↓
format_output_node         → Applies character limits + hashtag rules
  ↓
stream_results_node        → Sends posts via WebSocket to frontend
  ↓
END
```

Each step broadcasts its status to the frontend in real-time via WebSocket.

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login + get JWT |
| GET | `/api/auth/me` | Current user info |
| PUT | `/api/auth/profile` | Update profile |
| PUT | `/api/auth/api-keys` | Save API keys |
| DELETE | `/api/auth/me` | Delete account |
| POST | `/api/brands` | Create brand + trigger RAG |
| GET | `/api/brands` | List user's brands |
| PUT | `/api/brands/{id}` | Update brand |
| DELETE | `/api/brands/{id}` | Delete brand |
| POST | `/api/brands/{id}/upload-doc` | Upload brand doc for RAG |
| POST | `/api/content/generate` | Trigger AI content generation |
| GET | `/api/content` | List generated content |
| PUT | `/api/content/{id}` | Edit content |
| POST | `/api/scheduler` | Schedule a post |
| GET | `/api/scheduler` | List scheduled posts |
| GET | `/api/analytics` | Get analytics data |
| WS | `/ws/{user_id}` | Real-time agent streaming |

---

## 📱 Pages

| Page | Route | Description |
|------|-------|-------------|
| Landing | `/` | Hero + features + pricing |
| Login | `/login` | JWT authentication |
| Register | `/register` | New user signup |
| Dashboard | `/dashboard` | Stats + agent activity |
| Brand Setup | `/brand-setup` | 4-step brand configuration + RAG |
| Content Studio | `/content-studio` | AI content generation + streaming |
| Scheduler | `/scheduler` | Calendar + post scheduling |
| Analytics | `/analytics` | Charts + performance metrics |
| Settings | `/settings` | Profile + API keys + notifications |

---

## 🚀 Production Deployment

1. Switch `DATABASE_URL` to PostgreSQL
2. Set real `OPENAI_API_KEY` and `PINECONE_API_KEY`
3. Create Pinecone index named `socialmind` (dimension: 1536, metric: cosine)
4. Change `JWT_SECRET_KEY` to a secure random string
5. Build frontend: `npm run build`
6. Deploy backend with gunicorn/uvicorn behind nginx

---

## 📄 License

MIT © SocialMind AI 2024
