from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, List
import os

# Import utility functions
from utils.system_info import (
    get_system_info, 
    get_system_stats, 
    get_storage_info, 
    get_available_gpus,
    get_available_storage_locations
)
from utils.settings_manager import SettingsManager

# Create router
router = APIRouter()

# Helper function to get settings manager
def get_settings_manager():
    settings_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "settings.json")
    return SettingsManager(settings_file)

@router.get("/info")
async def get_info() -> Dict[str, Any]:
    """Get system information"""
    return get_system_info()

@router.get("/stats")
async def get_stats(settings_manager: SettingsManager = Depends(get_settings_manager)) -> Dict[str, Any]:
    """Get system statistics"""
    settings = settings_manager.get_settings()
    gpu_id = settings.get("selectedGpuId", None)
    return get_system_stats(gpu_id)

@router.get("/storage")
async def get_storage(settings_manager: SettingsManager = Depends(get_settings_manager)) -> Dict[str, Any]:
    """Get storage information"""
    settings = settings_manager.get_settings()
    comfyui_path = settings.get("comfyUIPath", "")
    storage_path = settings.get("selectedStoragePath", None)
    return get_storage_info(comfyui_path, storage_path)

@router.get("/available-gpus")
async def get_gpus() -> List[Dict[str, Any]]:
    """Get a list of available GPUs"""
    return get_available_gpus()

@router.get("/available-storage")
async def get_storage_locations() -> List[Dict[str, Any]]:
    """Get a list of available storage locations"""
    return get_available_storage_locations()
