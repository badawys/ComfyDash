import os
import sys
import json
import shutil
import requests
import time
import uuid
import threading
from typing import Dict, Any, List, Optional, Tuple
from pathlib import Path
import urllib.parse
from tqdm import tqdm
from utils.settings_manager import SettingsManager

# For HuggingFace integration
try:
    from huggingface_hub import hf_hub_download, list_models
    from huggingface_hub.utils import RepositoryNotFoundError, RevisionNotFoundError
    HF_AVAILABLE = True
except ImportError:
    HF_AVAILABLE = False

# Dictionary to track active downloads
active_downloads = {}

class ModelDownloader:
    def __init__(self, models_dir: str):
        self.models_dir = models_dir
        self.download_threads = {}
        
        # Create models directory structure if it doesn't exist
        self._ensure_model_dirs()
    
    def _ensure_model_dirs(self):
        """Ensure all model type directories exist"""
        model_types = [
            "checkpoints", "vae", "loras", "controlnet", 
            "embeddings", "upscale_models", "clip", "other"
        ]
        
        for model_type in model_types:
            os.makedirs(os.path.join(self.models_dir, model_type), exist_ok=True)
    
    def get_model_path(self, model_type: str) -> str:
        """Get the path for a specific model type"""
        # Map frontend model types to directory names
        type_mapping = {
            "checkpoint": "checkpoints",
            "vae": "vae",
            "lora": "loras",
            "controlnet": "controlnet",
            "embedding": "embeddings",
            "upscaler": "upscale_models",
            "clip": "clip"
        }
        
        dir_name = type_mapping.get(model_type.lower(), "other")
        return os.path.join(self.models_dir, dir_name)
    
    def download_from_url(self, url: str, model_name: str, model_type: str, download_id: str) -> None:
        """Download a model from a direct URL"""
        target_dir = self.get_model_path(model_type)
        os.makedirs(target_dir, exist_ok=True)
        
        # Sanitize filename
        filename = os.path.basename(urllib.parse.urlparse(url).path)
        if not filename or filename.endswith('/'):
            filename = f"{model_name}.safetensors"
        
        target_path = os.path.join(target_dir, filename)
        
        try:
            # Update download status
            active_downloads[download_id] = {
                "status": "starting",
                "progress": 0,
                "speed": "0 KB/s",
                "eta": "unknown",
                "downloaded": "0 KB",
                "total": "unknown",
                "model_name": model_name,
                "model_type": model_type,
                "target_path": target_path,
                "timestamp": time.time()
            }
            
            # Start the download
            response = requests.get(url, stream=True)
            response.raise_for_status()
            
            # Get total file size if available
            total_size = int(response.headers.get('content-length', 0))
            total_size_str = self._format_size(total_size) if total_size else "unknown"
            
            # Update download status with total size
            active_downloads[download_id]["total"] = total_size_str
            
            # Download with progress tracking
            start_time = time.time()
            downloaded = 0
            
            with open(target_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
                        downloaded += len(chunk)
                        
                        # Calculate progress and speed
                        progress = (downloaded / total_size * 100) if total_size else 0
                        elapsed = time.time() - start_time
                        speed = downloaded / elapsed if elapsed > 0 else 0
                        
                        # Calculate ETA
                        if speed > 0 and total_size:
                            eta_seconds = (total_size - downloaded) / speed
                            eta = self._format_time(eta_seconds)
                        else:
                            eta = "unknown"
                        
                        # Update download status
                        active_downloads[download_id] = {
                            "status": "downloading",
                            "progress": round(progress, 1),
                            "speed": self._format_size(speed) + "/s",
                            "eta": eta,
                            "downloaded": self._format_size(downloaded),
                            "total": total_size_str,
                            "model_name": model_name,
                            "model_type": model_type,
                            "target_path": target_path,
                            "timestamp": time.time()
                        }
            
            # Download completed
            active_downloads[download_id] = {
                "status": "completed",
                "progress": 100,
                "speed": "0 KB/s",
                "eta": "0s",
                "downloaded": total_size_str,
                "total": total_size_str,
                "model_name": model_name,
                "model_type": model_type,
                "target_path": target_path,
                "timestamp": time.time()
            }
            
        except Exception as e:
            # Download failed
            active_downloads[download_id] = {
                "status": "failed",
                "error": str(e),
                "model_name": model_name,
                "model_type": model_type,
                "target_path": target_path,
                "timestamp": time.time()
            }
    
    def download_from_civitai(self, model_id: str, model_name: str, model_type: str, download_id: str, version_id: str = None) -> None:
        """Download a model from Civitai with optional version_id"""
        try:
            # Update download status
            active_downloads[download_id] = {
                "status": "starting",
                "progress": 0,
                "model_name": model_name,
                "model_type": model_type,
                "timestamp": time.time()
            }
            
            # Get settings to access the API key
            settings_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "settings.json")
            settings_manager = SettingsManager(settings_file)
            settings = settings_manager.get_settings()
            
            # Get model info from Civitai API
            api_url = f"https://civitai.com/api/v1/models/{model_id}"
            
            # Add API key if available
            headers = {}
            if 'civitaiApiKey' in settings and settings['civitaiApiKey']:
                headers['Authorization'] = f"Bearer {settings['civitaiApiKey']}"
            
            response = requests.get(api_url, headers=headers)
            response.raise_for_status()
            model_info = response.json()
            
            # Find the specified version or latest version and download URL
            if "modelVersions" in model_info and len(model_info["modelVersions"]) > 0:
                # If version_id is specified, find that version
                if version_id:
                    version = next((v for v in model_info["modelVersions"] if str(v.get("id")) == version_id), None)
                    if not version:
                        # If specified version not found, log error and fall back to latest version
                        print(f"Warning: Specified version {version_id} not found, falling back to latest version")
                        version = model_info["modelVersions"][0]  # Latest version
                else:
                    version = model_info["modelVersions"][0]  # Latest version
                
                # Find the primary file or first file
                download_url = None
                if "files" in version and len(version["files"]) > 0:
                    for file in version["files"]:
                        if file.get("primary", False):
                            download_url = file["downloadUrl"]
                            break
                    
                    # If no primary file found, use the first one
                    if not download_url and len(version["files"]) > 0:
                        download_url = version["files"][0]["downloadUrl"]
                
                if download_url:
                    # Now download from the URL
                    self.download_from_url(download_url, model_name, model_type, download_id)
                    return
            
            # If we got here, something went wrong
            active_downloads[download_id] = {
                "status": "failed",
                "error": "Could not find download URL in Civitai API response",
                "model_name": model_name,
                "model_type": model_type,
                "timestamp": time.time()
            }
            
        except Exception as e:
            # Download failed
            active_downloads[download_id] = {
                "status": "failed",
                "error": str(e),
                "model_name": model_name,
                "model_type": model_type,
                "timestamp": time.time()
            }
    
    def download_from_huggingface(self, repo_id: str, model_name: str, model_type: str, download_id: str) -> None:
        """Download a model from HuggingFace"""
        if not HF_AVAILABLE:
            active_downloads[download_id] = {
                "status": "failed",
                "error": "HuggingFace Hub library not available. Install with 'pip install huggingface-hub'",
                "model_name": model_name,
                "model_type": model_type,
                "timestamp": time.time()
            }
            return
        
        target_dir = self.get_model_path(model_type)
        os.makedirs(target_dir, exist_ok=True)
        
        try:
            # Update download status
            active_downloads[download_id] = {
                "status": "starting",
                "progress": 0,
                "model_name": model_name,
                "model_type": model_type,
                "timestamp": time.time()
            }
            
            # Try to find the model file (usually .safetensors or .ckpt)
            try:
                # This is a simplified approach - in a real implementation,
                # you would need to determine which file to download
                filename = f"{model_name}.safetensors"
                target_path = os.path.join(target_dir, filename)
                
                # Download with progress tracking
                def progress_callback(progress):
                    active_downloads[download_id] = {
                        "status": "downloading",
                        "progress": round(progress * 100, 1),
                        "model_name": model_name,
                        "model_type": model_type,
                        "target_path": target_path,
                        "timestamp": time.time()
                    }
                
                # Download the model
                hf_hub_download(
                    repo_id=repo_id,
                    filename="*.safetensors",  # This is a simplification
                    local_dir=target_dir,
                    local_dir_use_symlinks=False,
                    resume_download=True
                )
                
                # Download completed
                active_downloads[download_id] = {
                    "status": "completed",
                    "progress": 100,
                    "model_name": model_name,
                    "model_type": model_type,
                    "target_path": target_path,
                    "timestamp": time.time()
                }
                
            except (RepositoryNotFoundError, RevisionNotFoundError) as e:
                active_downloads[download_id] = {
                    "status": "failed",
                    "error": f"Repository or file not found: {str(e)}",
                    "model_name": model_name,
                    "model_type": model_type,
                    "timestamp": time.time()
                }
            
        except Exception as e:
            # Download failed
            active_downloads[download_id] = {
                "status": "failed",
                "error": str(e),
                "model_name": model_name,
                "model_type": model_type,
                "timestamp": time.time()
            }
    
    def start_download(self, source: str, model_id: str = None, version_id: str = None, url: str = None, 
                      model_name: str = None, model_type: str = "checkpoint", 
                      target_path: str = None) -> Dict[str, Any]:
        """Start a model download based on source"""
        # Generate a unique download ID
        download_id = str(uuid.uuid4())
        
        # Set default model name if not provided
        if not model_name:
            if model_id:
                model_name = f"model_{model_id}"
            elif url:
                model_name = os.path.basename(urllib.parse.urlparse(url).path)
                model_name = os.path.splitext(model_name)[0]
            else:
                model_name = f"model_{download_id[:8]}"
        
        # Start download in a separate thread based on source
        if source.lower() == "civitai" and model_id:
            thread = threading.Thread(
                target=self.download_from_civitai,
                args=(model_id, model_name, model_type, download_id, version_id)
            )
            thread.daemon = True
            thread.start()
            self.download_threads[download_id] = thread
        
        elif source.lower() == "huggingface" and model_id:
            thread = threading.Thread(
                target=self.download_from_huggingface,
                args=(model_id, model_name, model_type, download_id)
            )
            thread.daemon = True
            thread.start()
            self.download_threads[download_id] = thread
        
        elif source.lower() == "url" and url:
            thread = threading.Thread(
                target=self.download_from_url,
                args=(url, model_name, model_type, download_id)
            )
            thread.daemon = True
            thread.start()
            self.download_threads[download_id] = thread
        
        else:
            return {
                "status": "error",
                "message": "Invalid source or missing required parameters"
            }
        
        return {
            "downloadId": download_id,
            "status": "started",
            "model": {
                "name": model_name,
                "type": model_type,
                "source": source,
                "sourceId": model_id,
                "targetPath": target_path or self.get_model_path(model_type)
            }
        }
    
    def get_download_status(self, download_id: str) -> Dict[str, Any]:
        """Get the status of a download"""
        if download_id in active_downloads:
            return {
                "downloadId": download_id,
                **active_downloads[download_id]
            }
        else:
            return {
                "downloadId": download_id,
                "status": "not_found",
                "message": "Download not found"
            }
    
    def get_all_downloads(self) -> List[Dict[str, Any]]:
        """Get all active downloads"""
        return [
            {"downloadId": download_id, **status}
            for download_id, status in active_downloads.items()
        ]
    
    def cancel_download(self, download_id: str) -> Dict[str, Any]:
        """Cancel a download (limited support)"""
        if download_id in active_downloads:
            # Mark as cancelled, but the thread will continue
            # (proper cancellation would require more complex implementation)
            active_downloads[download_id]["status"] = "cancelled"
            return {
                "downloadId": download_id,
                "status": "cancelled",
                "message": "Download marked as cancelled"
            }
        else:
            return {
                "downloadId": download_id,
                "status": "not_found",
                "message": "Download not found"
            }
    
    def get_installed_models(self) -> List[Dict[str, Any]]:
        """Get a list of all installed models"""
        models = []
        
        # Map directory names to frontend model types
        type_mapping = {
            "checkpoints": "checkpoint",
            "vae": "vae",
            "loras": "lora",
            "controlnet": "controlnet",
            "embeddings": "embedding",
            "upscale_models": "upscaler",
            "clip": "clip",
            "other": "other"
        }
        
        # Scan all model directories
        for dir_name, model_type in type_mapping.items():
            dir_path = os.path.join(self.models_dir, dir_name)
            if os.path.exists(dir_path):
                for root, _, files in os.walk(dir_path):
                    for file in files:
                        if file.endswith(('.safetensors', '.ckpt', '.pt', '.bin', '.pth')):
                            file_path = os.path.join(root, file)
                            file_size = os.path.getsize(file_path)
                            file_mtime = os.path.getmtime(file_path)
                            
                            models.append({
                                "id": f"{model_type}_{len(models)}",
                                "name": os.path.splitext(file)[0],
                                "type": model_type,
                                "path": file_path,
                                "size": self._format_size(file_size),
                                "size_bytes": file_size,
                                "dateAdded": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(file_mtime)),
                                "source": "local",
                                "sourceId": ""
                            })
        
        return models
    
    def delete_model(self, model_path: str) -> Dict[str, Any]:
        """Delete a model file"""
        if os.path.exists(model_path) and os.path.isfile(model_path):
            try:
                os.remove(model_path)
                return {
                    "status": "success",
                    "message": f"Model deleted: {os.path.basename(model_path)}"
                }
            except Exception as e:
                return {
                    "status": "error",
                    "message": f"Failed to delete model: {str(e)}"
                }
        else:
            return {
                "status": "error",
                "message": "Model file not found"
            }
    
    def search_civitai_models(self, query: str, model_type: str = None, page: int = 1) -> Dict[str, Any]:
        """Search for models on Civitai"""
        try:
            # Get settings to access the API key
            settings_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "settings.json")
            settings_manager = SettingsManager(settings_file)
            settings = settings_manager.get_settings()
            
            # Build the API URL
            api_url = "https://civitai.com/api/v1/models"
            params = {
                "limit": 20,
                "page": page,
                "query": query
            }
            
            # Add type filter if specified
            if model_type:
                # Map frontend types to Civitai types
                type_mapping = {
                    "checkpoint": "Checkpoint",
                    "lora": "LORA",
                    "vae": "VAE",
                    "controlnet": "ControlNet",
                    "embedding": "TextualInversion",
                    "upscaler": "Upscaler"
                }
                
                civitai_type = type_mapping.get(model_type.lower())
                if civitai_type:
                    params["types"] = civitai_type
            
            # Make the API request with API key if available
            headers = {}
            if 'civitaiApiKey' in settings and settings['civitaiApiKey']:
                headers['Authorization'] = f"Bearer {settings['civitaiApiKey']}"
            
            response = requests.get(api_url, params=params, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            # Process the results
            results = []
            for item in data.get("items", []):
                # Get the latest version
                version = item.get("modelVersions", [])[0] if item.get("modelVersions") else {}
                
                # Get the first image if available
                image_url = ""
                if version.get("images") and len(version.get("images", [])) > 0:
                    image_url = version["images"][0].get("url", "")
                
                results.append({
                    "id": item.get("id"),
                    "name": item.get("name"),
                    "type": item.get("type"),
                    "nsfw": item.get("nsfw", False),
                    "description": item.get("description", ""),
                    "image": image_url,
                    "downloadCount": item.get("downloadCount", 0),
                    "rating": item.get("rating", 0),
                    "versionId": version.get("id") if version else None,
                    "versionName": version.get("name") if version else None,
                    "source": "civitai"
                })
            
            return {
                "items": results,
                "metadata": {
                    "totalItems": data.get("metadata", {}).get("totalItems", 0),
                    "currentPage": page,
                    "pageSize": 20,
                    "totalPages": data.get("metadata", {}).get("totalPages", 1)
                }
            }
            
        except Exception as e:
            return {
                "items": [],
                "error": str(e),
                "metadata": {
                    "totalItems": 0,
                    "currentPage": page,
                    "pageSize": 20,
                    "totalPages": 1
                }
            }
    
    def search_huggingface_models(self, query: str, model_type: str = None, page: int = 1) -> Dict[str, Any]:
        """Search for models on HuggingFace"""
        if not HF_AVAILABLE:
            return {
                "items": [],
                "error": "HuggingFace Hub library not available",
                "metadata": {
                    "totalItems": 0,
                    "currentPage": page,
                    "pageSize": 20,
                    "totalPages": 1
                }
            }
        
        try:
            # Map frontend types to HuggingFace filter tags
            type_filter = None
            if model_type:
                type_mapping = {
                    "checkpoint": "diffusers",
                    "lora": "lora",
                    "controlnet": "controlnet"
                }
                type_filter = type_mapping.get(model_type.lower())
            
            # Search HuggingFace models
            models = list_models(
                search=query,
                filter=type_filter,
                limit=20,
                offset=(page - 1) * 20
            )
            
            # Process the results
            results = []
            for model in models:
                results.append({
                    "id": model.id,
                    "name": model.id.split("/")[-1],
                    "type": model_type or "unknown",
                    "description": model.description or "",
                    "image": "",  # HF doesn't provide images in the API
                    "downloadCount": model.downloads or 0,
                    "likes": model.likes or 0,
                    "author": model.author or "",
                    "source": "huggingface"
                })
            
            return {
                "items": results,
                "metadata": {
                    "totalItems": 1000,  # HF doesn't provide total count easily
                    "currentPage": page,
                    "pageSize": 20,
                    "totalPages": 50  # Arbitrary limit
                }
            }
            
        except Exception as e:
            return {
                "items": [],
                "error": str(e),
                "metadata": {
                    "totalItems": 0,
                    "currentPage": page,
                    "pageSize": 20,
                    "totalPages": 1
                }
            }
    
    def _format_size(self, size_bytes: int) -> str:
        """Format file size in human-readable format"""
        if size_bytes == 0:
            return "0 B"
        
        size_names = ("B", "KB", "MB", "GB", "TB")
        i = 0
        while size_bytes >= 1024 and i < len(size_names) - 1:
            size_bytes /= 1024.0
            i += 1
        
        return f"{size_bytes:.2f} {size_names[i]}"
    
    def _format_time(self, seconds: float) -> str:
        """Format time in human-readable format"""
        if seconds < 60:
            return f"{seconds:.0f}s"
        elif seconds < 3600:
            minutes = seconds / 60
            return f"{minutes:.0f}m {seconds % 60:.0f}s"
        else:
            hours = seconds / 3600
            minutes = (seconds % 3600) / 60
            return f"{hours:.0f}h {minutes:.0f}m"
