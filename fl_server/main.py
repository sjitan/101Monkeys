import os
from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import Dict

# Load environment variables from .env file
load_dotenv()

app = FastAPI()

class ModelDelta(BaseModel):
    apv: str
    model_delta: str

@app.get("/")
async def root():
    """A simple health check endpoint."""
    return {"message": "101st Monkey Labs Federated Learning Server is running."}

@app.post("/api/v1/delta/upload")
async def upload_model_delta(delta: ModelDelta):
    """
    Receives an anonymized model_delta from a client to be aggregated.
    (Placeholder implementation)
    """
    print(f"Received model delta for APV: {delta.apv}")
    # In a real implementation, this would trigger a secure aggregation process.
    return {"status": "success", "message": f"Delta for {delta.apv} received and queued for aggregation."}

@app.get("/api/v1/model/download/{apv}")
async def download_model(apv: str):
    """
    Downloads the latest aggregated cluster model for the user's archetype.
    (Placeholder implementation)
    """
    print(f"Request for model download for APV: {apv}")
    # In a real implementation, this would fetch the latest model from a secure model store.
    return {"status": "success", "apv": apv, "model_version": "0.1.0-alpha", "model_data": "..."}

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, apv: str):
        await websocket.accept()
        if apv not in self.active_connections:
            self.active_connections[apv] = []
        self.active_connections[apv].append(websocket)
        print(f"New connection for APV '{apv}'. Total connections for this APV: {len(self.active_connections[apv])}")


    def disconnect(self, websocket: WebSocket, apv: str):
        self.active_connections[apv].remove(websocket)
        print(f"Connection for APV '{apv}' closed. Total connections for this APV: {len(self.active_connections[apv])}")


    async def broadcast_to_group(self, message: str, apv: str):
        if apv in self.active_connections:
            for connection in self.active_connections[apv]:
                await connection.send_text(message)

manager = ConnectionManager()

@app.websocket("/ws/group_sync/{apv}")
async def websocket_endpoint(websocket: WebSocket, apv: str):
    """
    Handles the real-time Group Sync event.
    """
    await manager.connect(websocket, apv)
    try:
        while True:
            data = await websocket.receive_text()
            # This is where the server would act as a "conductor"
            # For now, it just echoes the data back to the group
            print(f"Received data from {apv} group: {data}")
            await manager.broadcast_to_group(f"Conductor command based on data: {data}", apv)
    except WebSocketDisconnect:
        manager.disconnect(websocket, apv)
        await manager.broadcast_to_group(f"A user from APV '{apv}' has left the group.", apv)

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
