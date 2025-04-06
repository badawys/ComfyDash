from fastapi import APIRouter, Depends, HTTPException, Body, BackgroundTasks
from typing import Dict, Any, Optional
import os

# Import utility functions
from utils.comfyui_manager import ComfyUIManager
from utils.settings_manager import SettingsManager

# Create router
router = APIRouter()

# Helper function to get settings manager
def get_settings_manager():
    settings_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "settings.json")
    return SettingsManager(settings_file)

# Helper function to get ComfyUI manager
def get_comfyui_manager(settings_manager: SettingsManager = Depends(get_settings_manager)):
    settings = settings_manager.get_settings()
    comfyui_path = settings.get("comfyUIPath", "")
    
    # Create ComfyUIManager even if path doesn't exist - it will handle this case internally
    return ComfyUIManager(comfyui_path)

@router.get("/status")
async def get_status(
    comfyui_manager: ComfyUIManager = Depends(get_comfyui_manager)
) -> Dict[str, Any]:
    """Get the current status of ComfyUI"""
    return comfyui_manager.get_status()

@router.post("/start")
async def start_comfyui(
    port: Optional[int] = Body(8188, embed=True),
    comfyui_manager: ComfyUIManager = Depends(get_comfyui_manager)
) -> Dict[str, Any]:
    """Start the ComfyUI process"""
    return comfyui_manager.start_comfyui(port)

@router.post("/stop")
async def stop_comfyui(
    comfyui_manager: ComfyUIManager = Depends(get_comfyui_manager)
) -> Dict[str, Any]:
    """Stop the ComfyUI process"""
    return comfyui_manager.stop_comfyui()

@router.post("/restart")
async def restart_comfyui(
    port: Optional[int] = Body(8188, embed=True),
    comfyui_manager: ComfyUIManager = Depends(get_comfyui_manager)
) -> Dict[str, Any]:
    """Restart the ComfyUI process"""
    return comfyui_manager.restart_comfyui(port)

@router.get("/processes")
async def find_comfyui_processes(
    comfyui_manager: ComfyUIManager = Depends(get_comfyui_manager)
) -> Dict[str, Any]:
    """Find running ComfyUI processes"""
    processes = comfyui_manager.find_comfyui_processes()
    return {"processes": processes, "count": len(processes)}

@router.post("/path")
async def set_comfyui_path(
    path: str = Body(..., embed=True),
    comfyui_manager: ComfyUIManager = Depends(get_comfyui_manager),
    settings_manager: SettingsManager = Depends(get_settings_manager)
) -> Dict[str, Any]:
    """Set the path to the ComfyUI installation"""
    success = comfyui_manager.set_comfyui_path(path)
    
    if success:
        # Update settings with new path
        settings_manager.update_settings({"comfyUIPath": path})
        return {"status": "success", "message": "ComfyUI path updated successfully"}
    else:
        raise HTTPException(status_code=400, detail="Invalid ComfyUI path")

@router.get("/logs")
async def get_logs(
    max_lines: int = 100,
    comfyui_manager: ComfyUIManager = Depends(get_comfyui_manager)
) -> Dict[str, Any]:
    """Get the logs from the ComfyUI process"""
    return comfyui_manager.get_logs(max_lines)

@router.post("/install")
async def install_comfyui(
    install_path: Optional[str] = Body(None),
    method: str = Body("git"),
    comfyui_manager: ComfyUIManager = Depends(get_comfyui_manager),
    settings_manager: SettingsManager = Depends(get_settings_manager),
    background_tasks: BackgroundTasks = BackgroundTasks()
) -> Dict[str, Any]:
    """Install ComfyUI to the specified path"""
    # Forward to the install endpoint
    from api.install import install_comfyui as install_comfyui_func
    return await install_comfyui_func(background_tasks, install_path, method, settings_manager)

@router.get("/install/status")
async def get_install_status(
    comfyui_manager: ComfyUIManager = Depends(get_comfyui_manager),
    settings_manager: SettingsManager = Depends(get_settings_manager)
) -> Dict[str, Any]:
    """Get the status of the ComfyUI installation"""
    settings = settings_manager.get_settings()
    comfyui_path = settings.get("comfyUIPath", "")
    
    if not comfyui_path or not os.path.exists(comfyui_path):
        return {
            "status": "not_installed",
            "message": "ComfyUI is not installed or the path is not configured",
            "path": comfyui_path
        }
    
    # Check if it looks like a valid ComfyUI installation
    if os.path.exists(os.path.join(comfyui_path, "main.py")) or \
       os.path.exists(os.path.join(comfyui_path, "comfy.py")):
        return {
            "status": "installed",
            "message": "ComfyUI is installed",
            "path": comfyui_path
        }
    else:
        return {
            "status": "invalid",
            "message": "The configured path does not appear to be a valid ComfyUI installation",
            "path": comfyui_path
        }
