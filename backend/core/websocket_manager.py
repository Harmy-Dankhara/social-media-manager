"""
WebSocket Connection Manager
Manages per-user WebSocket connections for real-time streaming.
"""
import asyncio
import json
import logging
from typing import Dict
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        logger.info(f"WebSocket connected: user {user_id}")

    def disconnect(self, user_id: str):
        self.active_connections.pop(user_id, None)
        logger.info(f"WebSocket disconnected: user {user_id}")

    async def send_to_user(self, user_id: str, data: dict):
        websocket = self.active_connections.get(user_id)
        if websocket:
            try:
                await websocket.send_json(data)
            except Exception as e:
                logger.error(f"WebSocket send error for user {user_id}: {e}")
                self.disconnect(user_id)

    async def broadcast(self, data: dict):
        disconnected = []
        for user_id, websocket in self.active_connections.items():
            try:
                await websocket.send_json(data)
            except Exception:
                disconnected.append(user_id)
        for user_id in disconnected:
            self.disconnect(user_id)


manager = ConnectionManager()
