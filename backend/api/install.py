from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
import os
import sys
import subprocess
import shutil
import tempfile
import requests
from typing import Dict, Any, Optional
import zipfile
import platform
from git import Repo

# Fix imports to use absolute paths instead of relative paths
from api.settings import get_settings_manager
from utils.settings_manager import SettingsManager

router = APIRouter()

# ComfyUI repository URL
COMFYUI_REPO_URL = "https://github.com/comfyanonymous/ComfyUI.git"
COMFYUI_ZIP_URL = "https://github.com/comfyanonymous/ComfyUI/archive/refs/heads/master.zip"

@router.post("/comfyui")
async def install_comfyui(
    background_tasks: BackgroundTasks,
    install_path: Optional[str] = None,
    method: str = "git",
    settings_manager: SettingsManager = Depends(get_settings_manager)
) -> Dict[str, Any]:
    """Install ComfyUI to the specified path"""
    # If no install path is provided, use a default path
    if not install_path:
        # Default to a directory next to the current application
        parent_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        install_path = os.path.join(parent_dir, "ComfyUI")
    
    # Check if the directory already exists
    if os.path.exists(install_path):
        # Check if it looks like a ComfyUI installation
        if os.path.exists(os.path.join(install_path, "main.py")) or \
           os.path.exists(os.path.join(install_path, "comfy.py")):
            return {
                "status": "error",
                "message": f"ComfyUI already exists at {install_path}",
                "path": install_path
            }
    
    # Start the installation process in the background
    background_tasks.add_task(
        _install_comfyui_task, 
        install_path=install_path, 
        method=method,
        settings_manager=settings_manager
    )
    
    return {
        "status": "installing",
        "message": f"Installing ComfyUI to {install_path}",
        "path": install_path
    }

@router.get("/comfyui/status")
@router.get("/comfyui/install/status")  # Add this route to match frontend expectations
async def get_install_status(
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

async def _install_comfyui_task(install_path: str, method: str, settings_manager: SettingsManager):
    """Background task to install ComfyUI"""
    try:
        # Create the directory if it doesn't exist
        os.makedirs(install_path, exist_ok=True)
        
        if method == "git":
            # Clone the repository using GitPython
            Repo.clone_from(COMFYUI_REPO_URL, install_path)
        else:
            # Download the ZIP file
            with tempfile.NamedTemporaryFile(delete=False, suffix=".zip") as temp_file:
                response = requests.get(COMFYUI_ZIP_URL, stream=True)
                response.raise_for_status()
                
                for chunk in response.iter_content(chunk_size=8192):
                    temp_file.write(chunk)
                
                temp_file_path = temp_file.name
            
            # Extract the ZIP file
            with zipfile.ZipFile(temp_file_path, 'r') as zip_ref:
                # The ZIP contains a top-level directory, so we need to extract and rename
                zip_ref.extractall(os.path.dirname(install_path))
                
                # Get the name of the extracted directory
                extracted_dir = os.path.join(
                    os.path.dirname(install_path),
                    "ComfyUI-master"
                )
                
                # If the target directory is empty, remove it and rename the extracted dir
                if not os.listdir(install_path):
                    os.rmdir(install_path)
                    os.rename(extracted_dir, install_path)
                else:
                    # Copy all files from extracted dir to install path
                    for item in os.listdir(extracted_dir):
                        s = os.path.join(extracted_dir, item)
                        d = os.path.join(install_path, item)
                        if os.path.isdir(s):
                            shutil.copytree(s, d, dirs_exist_ok=True)
                        else:
                            shutil.copy2(s, d)
                    
                    # Remove the extracted directory
                    shutil.rmtree(extracted_dir)
            
            # Remove the temporary ZIP file
            os.unlink(temp_file_path)
        
        # Install dependencies
        requirements_file = os.path.join(install_path, "requirements.txt")
        if os.path.exists(requirements_file):
            subprocess.check_call([
                sys.executable, "-m", "pip", "install", "-r", requirements_file
            ])
        
        # Update settings with the new ComfyUI path
        settings_manager.update_settings({"comfyUIPath": install_path})
        
        return True
    except Exception as e:
        print(f"Error installing ComfyUI: {str(e)}")
        return False
