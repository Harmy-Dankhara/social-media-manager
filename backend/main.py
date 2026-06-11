"""
SocialMind AI — FastAPI Backend
Main application entry point
"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

from core.config import settings
from core.websocket_manager import manager
from db.database import create_tables

# Import all models so SQLAlchemy can discover them
from models import user, brand, content, competitor  # noqa: F401

# Routers
from routers import auth, brands, content as content_router, scheduler, analytics, competitors

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle."""
    logger.info("🚀 SocialMind AI starting up...")
    # Create tables (fallback if Alembic not configured)
    try:
        create_tables()
        logger.info("✅ Database tables created/verified")
    except Exception as e:
        logger.error(f"❌ Database error: {e}")
    
    # Start APScheduler
    try:
        from core.scheduler import start_scheduler
        start_scheduler()
    except Exception as e:
        logger.error(f"❌ Scheduler error: {e}")
        
    yield
    logger.info("👋 SocialMind AI shutting down...")


app = FastAPI(
    title="SocialMind AI API",
    description="AI Social Media Manager — powered by LangGraph + RAG",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(brands.router)
app.include_router(content_router.router)
app.include_router(scheduler.router)
app.include_router(analytics.router)
app.include_router(competitors.router)





@app.get("/health")
async def health():
    return {"status": "healthy"}


@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    """
    Real-time WebSocket endpoint for streaming AI agent steps + generated content.
    Messages: step | post | done | error | ping
    """
    await manager.connect(user_id, websocket)
    logger.info(f"WebSocket connected: {user_id}")

    # Send welcome ping
    await manager.send_to_user(user_id, {
        "type": "ping",
        "message": "Connected to SocialMind AI 🚀",
    })

    try:
        while True:
            # Keep connection alive, listen for client messages
            data = await websocket.receive_json()
            msg_type = data.get("type", "")

            if msg_type == "ping":
                await manager.send_to_user(user_id, {"type": "pong"})

    except WebSocketDisconnect:
        manager.disconnect(user_id)
        logger.info(f"WebSocket disconnected: {user_id}")
    except Exception as e:
        logger.error(f"WebSocket error for {user_id}: {e}")
        manager.disconnect(user_id)

# Serve React frontend
frontend_dist = os.path.join(os.path.dirname(__file__), "../frontend/dist")

if os.path.exists(frontend_dist):
    app.mount(
        "/assets",
        StaticFiles(directory=os.path.join(frontend_dist, "assets")),
        name="assets",
    )

    @app.get("/")
    async def serve_frontend():
        return FileResponse(os.path.join(frontend_dist, "index.html"))