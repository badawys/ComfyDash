import os
import sys
import json
import shutil
import requests
import time
import uuid
import threading
import subprocess
from typing import Dict, Any, List, Optional, Tuple
from pathlib import Path
import urllib.parse
import platform
import git

# Dictionary to track active installations
active_installations = {}

class CustomNodesManager:
    def __init__(self, custom_nodes_path: str):
        self.custom_nodes_path = custom_nodes_path
        self.installation_threads = {}
        
        # Create custom nodes directory if it doesn't exist
        os.makedirs(custom_nodes_path, exist_ok=True)
    
    def get_installed_nodes(self) -> List[Dict[str, Any]]:
        """Get a list of all installed custom nodes"""
        nodes = []
        
        if not os.path.exists(self.custom_nodes_path):
            return nodes
        
        # Scan all subdirectories in the custom_nodes directory
        for item in os.listdir(self.custom_nodes_path):
            item_path = os.path.join(self.custom_nodes_path, item)
            
            # Only consider directories
            if os.path.isdir(item_path):
                # Check if it's a git repository
                is_git_repo = os.path.exists(os.path.join(item_path, ".git"))
                
                # Try to find metadata
                metadata = {}
                metadata_path = os.path.join(item_path, "custom-node-info.json")
                if os.path.exists(metadata_path):
                    try:
                        with open(metadata_path, 'r') as f:
                            metadata = json.load(f)
                    except:
                        pass
                
                # Count Python files
                py_files = []
                for root, _, files in os.walk(item_path):
                    for file in files:
                        if file.endswith(".py"):
                            py_files.append(os.path.join(root, file))
                
                # Get last modified time
                try:
                    last_modified = os.path.getmtime(item_path)
                except:
                    last_modified = 0
                
                # Get git info if available
                git_info = {}
                if is_git_repo:
                    try:
                        repo = git.Repo(item_path)
                        git_info = {
                            "url": next((remote.url for remote in repo.remotes), ""),
                            "branch": repo.active_branch.name,
                            "commit": str(repo.head.commit)[:8],
                            "last_commit_time": repo.head.commit.committed_date
                        }
                    except:
                        pass
                
                nodes.append({
                    "id": f"node_{len(nodes)}",
                    "name": metadata.get("name", item),
                    "title": metadata.get("title", item),
                    "author": metadata.get("author", "Unknown"),
                    "description": metadata.get("description", ""),
                    "version": metadata.get("version", "0.0.0"),
                    "path": item_path,
                    "directory": item,
                    "files": len(py_files),
                    "installed": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(last_modified)),
                    "isGit": is_git_repo,
                    "gitInfo": git_info,
                    "tags": metadata.get("tags", []),
                    "dependencies": metadata.get("dependencies", []),
                    "nodeType": metadata.get("nodeType", "unknown")
                })
        
        return nodes
    
    def install_from_git(self, repo_url: str, branch: str = None, install_id: str = None) -> None:
        """Install custom nodes from a git repository"""
        if not install_id:
            install_id = str(uuid.uuid4())
        
        # Update installation status
        active_installations[install_id] = {
            "status": "starting",
            "progress": 0,
            "repo_url": repo_url,
            "branch": branch,
            "timestamp": time.time()
        }
        
        try:
            # Extract repository name from URL
            repo_name = os.path.basename(repo_url)
            if repo_name.endswith(".git"):
                repo_name = repo_name[:-4]
            
            target_path = os.path.join(self.custom_nodes_path, repo_name)
            
            # Update status
            active_installations[install_id] = {
                "status": "cloning",
                "progress": 10,
                "repo_url": repo_url,
                "branch": branch,
                "target_path": target_path,
                "timestamp": time.time()
            }
            
            # Clone the repository
            clone_args = ["git", "clone", repo_url, target_path]
            if branch:
                clone_args.extend(["--branch", branch])
            
            process = subprocess.Popen(
                clone_args,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            stdout, stderr = process.communicate()
            
            if process.returncode != 0:
                raise Exception(f"Git clone failed: {stderr}")
            
            # Update status
            active_installations[install_id] = {
                "status": "installing_dependencies",
                "progress": 50,
                "repo_url": repo_url,
                "branch": branch,
                "target_path": target_path,
                "timestamp": time.time()
            }
            
            # Check for requirements.txt and install dependencies
            requirements_path = os.path.join(target_path, "requirements.txt")
            if os.path.exists(requirements_path):
                # Install requirements
                pip_args = [sys.executable, "-m", "pip", "install", "-r", requirements_path]
                process = subprocess.Popen(
                    pip_args,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True
                )
                stdout, stderr = process.communicate()
                
                if process.returncode != 0:
                    active_installations[install_id] = {
                        "status": "warning",
                        "progress": 80,
                        "message": f"Installed but dependencies failed: {stderr}",
                        "repo_url": repo_url,
                        "branch": branch,
                        "target_path": target_path,
                        "timestamp": time.time()
                    }
                else:
                    active_installations[install_id] = {
                        "status": "dependencies_installed",
                        "progress": 80,
                        "repo_url": repo_url,
                        "branch": branch,
                        "target_path": target_path,
                        "timestamp": time.time()
                    }
            
            # Installation completed
            active_installations[install_id] = {
                "status": "completed",
                "progress": 100,
                "repo_url": repo_url,
                "branch": branch,
                "target_path": target_path,
                "timestamp": time.time()
            }
            
        except Exception as e:
            # Installation failed
            active_installations[install_id] = {
                "status": "failed",
                "error": str(e),
                "repo_url": repo_url,
                "branch": branch,
                "timestamp": time.time()
            }
    
    def update_node(self, node_path: str, install_id: str = None) -> None:
        """Update a custom node from its git repository"""
        if not install_id:
            install_id = str(uuid.uuid4())
        
        # Update installation status
        active_installations[install_id] = {
            "status": "starting",
            "progress": 0,
            "node_path": node_path,
            "timestamp": time.time()
        }
        
        try:
            # Check if it's a git repository
            if not os.path.exists(os.path.join(node_path, ".git")):
                raise Exception("Not a git repository")
            
            # Update status
            active_installations[install_id] = {
                "status": "updating",
                "progress": 20,
                "node_path": node_path,
                "timestamp": time.time()
            }
            
            # Pull the latest changes
            git_args = ["git", "-C", node_path, "pull"]
            process = subprocess.Popen(
                git_args,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            stdout, stderr = process.communicate()
            
            if process.returncode != 0:
                raise Exception(f"Git pull failed: {stderr}")
            
            # Update status
            active_installations[install_id] = {
                "status": "checking_dependencies",
                "progress": 60,
                "node_path": node_path,
                "timestamp": time.time()
            }
            
            # Check for requirements.txt and install dependencies
            requirements_path = os.path.join(node_path, "requirements.txt")
            if os.path.exists(requirements_path):
                # Install requirements
                pip_args = [sys.executable, "-m", "pip", "install", "-r", requirements_path]
                process = subprocess.Popen(
                    pip_args,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True
                )
                stdout, stderr = process.communicate()
                
                if process.returncode != 0:
                    active_installations[install_id] = {
                        "status": "warning",
                        "progress": 80,
                        "message": f"Updated but dependencies failed: {stderr}",
                        "node_path": node_path,
                        "timestamp": time.time()
                    }
                else:
                    active_installations[install_id] = {
                        "status": "dependencies_updated",
                        "progress": 80,
                        "node_path": node_path,
                        "timestamp": time.time()
                    }
            
            # Update completed
            active_installations[install_id] = {
                "status": "completed",
                "progress": 100,
                "node_path": node_path,
                "timestamp": time.time()
            }
            
        except Exception as e:
            # Update failed
            active_installations[install_id] = {
                "status": "failed",
                "error": str(e),
                "node_path": node_path,
                "timestamp": time.time()
            }
    
    def uninstall_node(self, node_path: str) -> Dict[str, Any]:
        """Uninstall a custom node"""
        try:
            if not os.path.exists(node_path) or not os.path.isdir(node_path):
                return {
                    "status": "error",
                    "message": "Node directory not found"
                }
            
            # Get the node name for the response
            node_name = os.path.basename(node_path)
            
            # Remove the directory
            shutil.rmtree(node_path)
            
            return {
                "status": "success",
                "message": f"Node '{node_name}' uninstalled successfully"
            }
            
        except Exception as e:
            return {
                "status": "error",
                "message": f"Failed to uninstall node: {str(e)}"
            }
    
    def start_installation(self, repo_url: str, branch: str = None) -> Dict[str, Any]:
        """Start a custom node installation"""
        # Generate a unique installation ID
        install_id = str(uuid.uuid4())
        
        # Start installation in a separate thread
        thread = threading.Thread(
            target=self.install_from_git,
            args=(repo_url, branch, install_id)
        )
        thread.daemon = True
        thread.start()
        self.installation_threads[install_id] = thread
        
        return {
            "installId": install_id,
            "status": "started",
            "repo": {
                "url": repo_url,
                "branch": branch
            }
        }
    
    def start_update(self, node_path: str) -> Dict[str, Any]:
        """Start a custom node update"""
        # Generate a unique installation ID
        install_id = str(uuid.uuid4())
        
        # Start update in a separate thread
        thread = threading.Thread(
            target=self.update_node,
            args=(node_path, install_id)
        )
        thread.daemon = True
        thread.start()
        self.installation_threads[install_id] = thread
        
        return {
            "installId": install_id,
            "status": "started",
            "node": {
                "path": node_path
            }
        }
    
    def get_installation_status(self, install_id: str) -> Dict[str, Any]:
        """Get the status of an installation"""
        if install_id in active_installations:
            return {
                "installId": install_id,
                **active_installations[install_id]
            }
        else:
            return {
                "installId": install_id,
                "status": "not_found",
                "message": "Installation not found"
            }
    
    def get_all_installations(self) -> List[Dict[str, Any]]:
        """Get all active installations"""
        return [
            {"installId": install_id, **status}
            for install_id, status in active_installations.items()
        ]
    
    def search_available_nodes(self, query: str = None, page: int = 1) -> Dict[str, Any]:
        """Search for available custom nodes from a registry"""
        try:
            # This is a placeholder - in a real implementation, you would
            # query a registry of custom nodes (e.g., from a GitHub API or custom registry)
            
            # For now, return some sample data
            nodes = [
                {
                    "id": "comfyui-reactor",
                    "name": "ComfyUI Reactor",
                    "description": "Face swap and face restoration for ComfyUI",
                    "author": "comfyanonymous",
                    "repo": "https://github.com/Gourieff/comfyui-reactor",
                    "stars": 250,
                    "downloads": 5000,
                    "lastUpdated": "2023-10-15T12:00:00Z",
                    "tags": ["face", "restoration", "swap"]
                },
                {
                    "id": "comfyui-impact-pack",
                    "name": "ComfyUI Impact Pack",
                    "description": "Collection of custom nodes for ComfyUI",
                    "author": "ltdrdata",
                    "repo": "https://github.com/ltdrdata/ComfyUI-Impact-Pack",
                    "stars": 350,
                    "downloads": 8000,
                    "lastUpdated": "2023-11-20T12:00:00Z",
                    "tags": ["utility", "nodes", "collection"]
                },
                {
                    "id": "comfyui-controlnet",
                    "name": "ComfyUI ControlNet",
                    "description": "ControlNet integration for ComfyUI",
                    "author": "Fannovel16",
                    "repo": "https://github.com/Fannovel16/comfyui_controlnet_aux",
                    "stars": 300,
                    "downloads": 7000,
                    "lastUpdated": "2023-12-05T12:00:00Z",
                    "tags": ["controlnet", "aux"]
                }
            ]
            
            # Filter by query if provided
            if query:
                query = query.lower()
                nodes = [
                    node for node in nodes
                    if query in node["name"].lower() or 
                       query in node["description"].lower() or
                       any(query in tag.lower() for tag in node["tags"])
                ]
            
            return {
                "items": nodes,
                "metadata": {
                    "totalItems": len(nodes),
                    "currentPage": page,
                    "pageSize": 10,
                    "totalPages": max(1, (len(nodes) + 9) // 10)
                }
            }
            
        except Exception as e:
            return {
                "items": [],
                "error": str(e),
                "metadata": {
                    "totalItems": 0,
                    "currentPage": page,
                    "pageSize": 10,
                    "totalPages": 1
                }
            }
