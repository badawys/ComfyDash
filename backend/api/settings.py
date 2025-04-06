from fastapi import APIRouter, Depends, HTTPException, Body
from typing import Dict, Any
import os

# Import utility functions
from utils.settings_manager import SettingsManager

# Create router
router = APIRouter()

# Helper function to get settings manager
def get_settings_manager():
    settings_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "settings.json")
    return SettingsManager(settings_file)

@router.get("/")
async def get_settings(
    settings_manager: SettingsManager = Depends(get_settings_manager)
) -> Dict[str, Any]:
    """Get current settings"""
    return settings_manager.get_settings()

@router.post("/")
async def update_settings(
    settings: Dict[str, Any] = Body(...),
    settings_manager: SettingsManager = Depends(get_settings_manager)
) -> Dict[str, Any]:
    """Update settings"""
    return settings_manager.update_settings(settings)

@router.get("/export")
async def export_settings(
    settings_manager: SettingsManager = Depends(get_settings_manager)
) -> Dict[str, Any]:
    """Export settings for backup"""
    return settings_manager.export_settings()

@router.post("/import")
async def import_settings(
    import_data: Dict[str, Any] = Body(...),
    settings_manager: SettingsManager = Depends(get_settings_manager)
) -> Dict[str, Any]:
    """Import settings from backup"""
    return settings_manager.import_settings(import_data)
