from fastapi import APIRouter
from typing import Dict, Any

# Create router
router = APIRouter()

@router.get("/")
async def get_health() -> Dict[str, Any]:
    """
    Health check endpoint to verify the API server is running
    Returns a simple status message indicating the server is running
    """
    return {
        "status": "running",
        "message": "ComfyDash API server is running"
    }
