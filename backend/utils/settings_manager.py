import os
import json
import time
from typing import Dict, Any, Optional

class SettingsManager:
    def __init__(self, settings_file: str):
        self.settings_file = settings_file
        self.settings = self._load_settings()
    
    def _load_settings(self) -> Dict[str, Any]:
        """Load settings from file or create default settings"""
        if os.path.exists(self.settings_file):
            try:
                with open(self.settings_file, 'r') as f:
                    return json.load(f)
            except Exception as e:
                print(f"Error loading settings: {str(e)}")
        
        # Default settings
        return {
            "comfyUIPath": self._find_comfyui_path(),
            "modelsPath": "",  # Will be set based on comfyUIPath
            "customNodesPath": "",  # Will be set based on comfyUIPath
            "autoUpdateEnabled": True,
            "checkForUpdatesOnStartup": True,
            "theme": "system",
            "refreshInterval": 1000,  # Default to 1 second refresh interval
            "maxConcurrentDownloads": 3,
            "defaultModelType": "checkpoint",
            "selectedGpuId": "0",  # Default GPU ID
            "selectedStoragePath": "",  # Default storage path
            "lastUpdated": time.time()
        }
    
    def _find_comfyui_path(self) -> str:
        """Try to find ComfyUI installation path"""
        # Common installation locations
        possible_paths = [
            os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(__file__)), '..')),  # Parent of backend directory
            os.path.expanduser("~/ComfyUI"),
            os.path.expanduser("~/comfyui"),
            "C:\\ComfyUI",
            "/opt/ComfyUI",
            "/usr/local/ComfyUI"
        ]
        
        for path in possible_paths:
            if os.path.exists(path) and os.path.isdir(path):
                # Check if it looks like a ComfyUI installation
                if os.path.exists(os.path.join(path, "main.py")) or \
                   os.path.exists(os.path.join(path, "comfy.py")):
                    return path
        
        return ""
    
    def save_settings(self) -> bool:
        """Save settings to file"""
        try:
            # Ensure directory exists
            os.makedirs(os.path.dirname(self.settings_file), exist_ok=True)
            
            # Update timestamp
            self.settings["lastUpdated"] = time.time()
            
            # Write settings to file
            with open(self.settings_file, 'w') as f:
                json.dump(self.settings, f, indent=2)
            
            return True
        except Exception as e:
            print(f"Error saving settings: {str(e)}")
            return False
    
    def get_settings(self) -> Dict[str, Any]:
        """Get current settings"""
        return self.settings
    
    def update_settings(self, new_settings: Dict[str, Any]) -> Dict[str, Any]:
        """Update settings with new values"""
        # Update only valid settings
        for key, value in new_settings.items():
            # Make sure to include the new settings fields
            if key in self.settings or key in ['selectedGpuId', 'selectedStoragePath']:
                self.settings[key] = value
        
        # If ComfyUI path is updated, update related paths
        if "comfyUIPath" in new_settings and new_settings["comfyUIPath"]:
            comfyui_path = new_settings["comfyUIPath"]
            
            # Only update if path exists and looks like ComfyUI
            if os.path.exists(comfyui_path) and os.path.isdir(comfyui_path):
                if os.path.exists(os.path.join(comfyui_path, "main.py")) or \
                   os.path.exists(os.path.join(comfyui_path, "comfy.py")):
                    # Update models path if not explicitly set
                    if "modelsPath" not in new_settings or not new_settings["modelsPath"]:
                        models_path = os.path.join(comfyui_path, "models")
                        if os.path.exists(models_path) and os.path.isdir(models_path):
                            self.settings["modelsPath"] = models_path
                    
                    # Update custom nodes path if not explicitly set
                    if "customNodesPath" not in new_settings or not new_settings["customNodesPath"]:
                        nodes_path = os.path.join(comfyui_path, "custom_nodes")
                        if os.path.exists(nodes_path) and os.path.isdir(nodes_path):
                            self.settings["customNodesPath"] = nodes_path
        
        # Save the updated settings
        self.save_settings()
        
        return self.settings
    
    def export_settings(self) -> Dict[str, Any]:
        """Export settings to a dictionary for backup"""
        export_data = {
            "settings": self.settings,
            "exportDate": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "version": "1.0.0"
        }
        
        return export_data
    
    def import_settings(self, import_data: Dict[str, Any]) -> Dict[str, Any]:
        """Import settings from a backup"""
        try:
            if "settings" in import_data:
                # Update settings from import data
                self.settings.update(import_data["settings"])
                
                # Save the imported settings
                self.save_settings()
                
                return {
                    "status": "success",
                    "message": "Settings imported successfully",
                    "settings": self.settings
                }
            else:
                return {
                    "status": "error",
                    "message": "Invalid import data format"
                }
        except Exception as e:
            return {
                "status": "error",
                "message": f"Error importing settings: {str(e)}"
            }
