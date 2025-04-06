from fastapi import APIRouter, Depends, HTTPException, Body
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
import os

# Import utility functions
from utils.custom_nodes_manager import CustomNodesManager
from utils.settings_manager import SettingsManager

# Create router
router = APIRouter()

# Helper function to get settings manager
def get_settings_manager():
    settings_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "settings.json")
    return SettingsManager(settings_file)

# Helper function to get custom nodes manager
def get_custom_nodes_manager(settings_manager: SettingsManager = Depends(get_settings_manager)):
    settings = settings_manager.get_settings()
    custom_nodes_path = settings.get("customNodesPath", "")
    
    if not custom_nodes_path or not os.path.exists(custom_nodes_path):
        # Fallback to ComfyUI custom_nodes directory
        comfyui_path = settings.get("comfyUIPath", "")
        if comfyui_path and os.path.exists(comfyui_path):
            custom_nodes_path = os.path.join(comfyui_path, "custom_nodes")
            os.makedirs(custom_nodes_path, exist_ok=True)
    
    if not custom_nodes_path or not os.path.exists(custom_nodes_path):
        raise HTTPException(status_code=500, detail="Custom nodes directory not configured or does not exist")
    
    return CustomNodesManager(custom_nodes_path)

# Model for installation request
class NodeInstallRequest(BaseModel):
    repoUrl: str
    branch: Optional[str] = None

@router.get("/list")
async def get_installed_nodes(
    manager: CustomNodesManager = Depends(get_custom_nodes_manager)
) -> List[Dict[str, Any]]:
    """Get a list of all installed custom nodes"""
    return manager.get_installed_nodes()

@router.post("/install")
async def install_node(
    request: NodeInstallRequest,
    manager: CustomNodesManager = Depends(get_custom_nodes_manager)
) -> Dict[str, Any]:
    """Start a custom node installation"""
    return manager.start_installation(request.repoUrl, request.branch)

@router.post("/update")
async def update_node(
    node_path: str = Body(..., embed=True),
    manager: CustomNodesManager = Depends(get_custom_nodes_manager)
) -> Dict[str, Any]:
    """Start a custom node update"""
    return manager.start_update(node_path)

@router.delete("/uninstall")
async def uninstall_node(
    node_path: str = Body(..., embed=True),
    manager: CustomNodesManager = Depends(get_custom_nodes_manager)
) -> Dict[str, Any]:
    """Uninstall a custom node"""
    return manager.uninstall_node(node_path)

@router.get("/status/{install_id}")
async def get_installation_status(
    install_id: str,
    manager: CustomNodesManager = Depends(get_custom_nodes_manager)
) -> Dict[str, Any]:
    """Get the status of an installation"""
    return manager.get_installation_status(install_id)

@router.get("/installations")
async def get_all_installations(
    manager: CustomNodesManager = Depends(get_custom_nodes_manager)
) -> List[Dict[str, Any]]:
    """Get all active installations"""
    return manager.get_all_installations()

@router.get("/search")
async def search_available_nodes(
    query: Optional[str] = None,
    page: int = 1,
    manager: CustomNodesManager = Depends(get_custom_nodes_manager)
) -> Dict[str, Any]:
    """Search for available custom nodes"""
    return manager.search_available_nodes(query, page)
