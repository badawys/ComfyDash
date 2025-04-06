from fastapi import APIRouter, Depends, HTTPException, Body
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
import os

# Import utility functions
from utils.model_manager import ModelDownloader
from utils.settings_manager import SettingsManager

# Create router
router = APIRouter()

# Helper function to get settings manager
def get_settings_manager():
    settings_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "settings.json")
    return SettingsManager(settings_file)

# Helper function to get model downloader
def get_model_downloader(settings_manager: SettingsManager = Depends(get_settings_manager)):
    settings = settings_manager.get_settings()
    models_path = settings.get("modelsPath", "")
    
    if not models_path or not os.path.exists(models_path):
        # Fallback to ComfyUI models directory
        comfyui_path = settings.get("comfyUIPath", "")
        if comfyui_path and os.path.exists(comfyui_path):
            models_path = os.path.join(comfyui_path, "models")
            os.makedirs(models_path, exist_ok=True)
    
    if not models_path or not os.path.exists(models_path):
        raise HTTPException(status_code=500, detail="Models directory not configured or does not exist")
    
    return ModelDownloader(models_path)

# Model for download request
class ModelDownloadRequest(BaseModel):
    source: str  # 'civitai', 'huggingface', 'url'
    modelId: Optional[str] = None
    url: Optional[str] = None
    modelName: Optional[str] = None
    modelType: str
    targetPath: Optional[str] = None
    
    model_config = {
        'protected_namespaces': ()  # Disable protected namespace warnings
    }

@router.post("/download")
async def download_model(
    request: ModelDownloadRequest,
    downloader: ModelDownloader = Depends(get_model_downloader)
) -> Dict[str, Any]:
    """Start a model download"""
    return downloader.start_download(
        source=request.source,
        model_id=request.modelId,
        url=request.url,
        model_name=request.modelName,
        model_type=request.modelType,
        target_path=request.targetPath
    )

@router.get("/status/{download_id}")
async def get_download_status(
    download_id: str,
    downloader: ModelDownloader = Depends(get_model_downloader)
) -> Dict[str, Any]:
    """Get the status of a download"""
    return downloader.get_download_status(download_id)

@router.get("/downloads")
async def get_all_downloads(
    downloader: ModelDownloader = Depends(get_model_downloader)
) -> List[Dict[str, Any]]:
    """Get all active downloads"""
    return downloader.get_all_downloads()

@router.delete("/download/{download_id}")
async def cancel_download(
    download_id: str,
    downloader: ModelDownloader = Depends(get_model_downloader)
) -> Dict[str, Any]:
    """Cancel a download"""
    return downloader.cancel_download(download_id)

@router.get("/list")
async def get_installed_models(
    downloader: ModelDownloader = Depends(get_model_downloader)
) -> List[Dict[str, Any]]:
    """Get a list of all installed models"""
    return downloader.get_installed_models()

@router.delete("/delete")
async def delete_model(
    file_path: str = Body(..., embed=True),
    downloader: ModelDownloader = Depends(get_model_downloader)
) -> Dict[str, Any]:
    """Delete a model file"""
    return downloader.delete_model(file_path)

@router.get("/search/civitai")
async def search_civitai(
    query: str,
    type: Optional[str] = None,
    page: int = 1,
    downloader: ModelDownloader = Depends(get_model_downloader)
) -> Dict[str, Any]:
    """Search for models on Civitai"""
    return downloader.search_civitai_models(query, type, page)

@router.get("/search/huggingface")
async def search_huggingface(
    query: str,
    type: Optional[str] = None,
    page: int = 1,
    downloader: ModelDownloader = Depends(get_model_downloader)
) -> Dict[str, Any]:
    """Search for models on HuggingFace"""
    return downloader.search_huggingface_models(query, type, page)
