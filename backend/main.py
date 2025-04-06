import os
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import API routers
from api.system import router as system_router
from api.models import router as models_router
from api.comfyui import router as comfyui_router
from api.settings import router as settings_router
from api.custom_nodes import router as custom_nodes_router
from api.install import router as install_router

# Create data directory if it doesn't exist
os.makedirs(os.path.join(os.path.dirname(__file__), "data"), exist_ok=True)

# Create FastAPI app
app = FastAPI(
    title="ComfyDash API",
    description="Backend API for ComfyDash - A comprehensive dashboard for ComfyUI",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(system_router, prefix="/api/system", tags=["System"])
app.include_router(models_router, prefix="/api/models", tags=["Models"])
app.include_router(comfyui_router, prefix="/api/comfyui", tags=["ComfyUI"])
app.include_router(settings_router, prefix="/api/settings", tags=["Settings"])
app.include_router(custom_nodes_router, prefix="/api/custom-nodes", tags=["Custom Nodes"])
app.include_router(install_router, prefix="/api/install", tags=["Installation"])

@app.get("/")
async def root():
    return {"message": "ComfyDash API is running"}

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    error_message = str(exc)
    if isinstance(exc, HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": error_message}
        )
    else:
        return JSONResponse(
            status_code=500,
            content={"error": "Internal Server Error", "detail": error_message}
        )

if __name__ == "__main__":
    # Get port from environment variable or use default
    port = int(os.getenv("API_PORT", 8618))
    
    # Run the API server
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
