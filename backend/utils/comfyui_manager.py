import os
import sys
import subprocess
import time
import json
import requests
from typing import Dict, Any, Optional, List, Tuple
import platform
import signal
import psutil

class ComfyUIManager:
    def __init__(self, comfyui_path: str = None):
        self.comfyui_path = comfyui_path or os.environ.get("COMFYUI_PATH", "")
        self.process = None
        self.api_url = "http://127.0.0.1:8188"
        self.status = "stopped"
        self.start_time = 0
    
    def set_comfyui_path(self, path: str) -> bool:
        """Set the path to the ComfyUI installation"""
        if os.path.exists(path):
            self.comfyui_path = path
            return True
        return False
    
    def start_comfyui(self, port: int = 8188) -> Dict[str, Any]:
        """Start the ComfyUI process"""
        if not self.comfyui_path or not os.path.exists(self.comfyui_path):
            return {"status": "error", "message": "ComfyUI path not set or invalid"}
        
        if self.is_running():
            return {"status": "already_running", "message": "ComfyUI is already running"}
        
        try:
            # Change to ComfyUI directory
            os.chdir(self.comfyui_path)
            
            # Determine the Python executable
            python_exe = sys.executable
            if not python_exe or not os.path.exists(python_exe):
                python_exe = "python" if platform.system() == "Windows" else "python3"
            
            # Build the command
            cmd = [python_exe, "main.py", f"--port={port}"]
            
            # Start the process
            if platform.system() == "Windows":
                # Use CREATE_NO_WINDOW flag on Windows to hide console
                self.process = subprocess.Popen(
                    cmd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                    creationflags=subprocess.CREATE_NO_WINDOW
                )
            else:
                self.process = subprocess.Popen(
                    cmd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True
                )
            
            self.start_time = time.time()
            self.status = "starting"
            self.api_url = f"http://127.0.0.1:{port}"
            
            # Wait a bit for the process to start
            time.sleep(2)
            
            # Check if process is running
            if self.process.poll() is None:
                # Wait for API to become available (max 30 seconds)
                for _ in range(15):
                    try:
                        response = requests.get(f"{self.api_url}/system_stats", timeout=2)
                        if response.status_code == 200:
                            self.status = "running"
                            return {
                                "status": "running",
                                "message": "ComfyUI started successfully",
                                "pid": self.process.pid,
                                "port": port
                            }
                    except:
                        pass
                    time.sleep(2)
                
                # If we got here, the API didn't respond but process is running
                self.status = "running_no_api"
                return {
                    "status": "running_no_api",
                    "message": "ComfyUI process started but API not responding",
                    "pid": self.process.pid,
                    "port": port
                }
            else:
                # Process failed to start
                stdout, stderr = self.process.communicate()
                self.status = "stopped"
                return {
                    "status": "error",
                    "message": "ComfyUI failed to start",
                    "stdout": stdout,
                    "stderr": stderr
                }
        
        except Exception as e:
            self.status = "error"
            return {"status": "error", "message": str(e)}
    
    def stop_comfyui(self) -> Dict[str, Any]:
        """Stop the ComfyUI process"""
        if not self.process or self.process.poll() is not None:
            self.status = "stopped"
            return {"status": "not_running", "message": "ComfyUI is not running"}
        
        try:
            # Try to terminate gracefully first
            if platform.system() == "Windows":
                self.process.terminate()
            else:
                os.kill(self.process.pid, signal.SIGTERM)
            
            # Wait for process to terminate (max 10 seconds)
            for _ in range(10):
                if self.process.poll() is not None:
                    self.status = "stopped"
                    return {"status": "stopped", "message": "ComfyUI stopped successfully"}
                time.sleep(1)
            
            # If still running, force kill
            if platform.system() == "Windows":
                self.process.kill()
            else:
                os.kill(self.process.pid, signal.SIGKILL)
            
            self.process.wait()
            self.status = "stopped"
            return {"status": "stopped", "message": "ComfyUI forcefully terminated"}
        
        except Exception as e:
            self.status = "error"
            return {"status": "error", "message": str(e)}
    
    def restart_comfyui(self, port: int = 8188) -> Dict[str, Any]:
        """Restart the ComfyUI process"""
        stop_result = self.stop_comfyui()
        time.sleep(2)  # Wait a bit before starting again
        start_result = self.start_comfyui(port)
        
        return {
            "stop_result": stop_result,
            "start_result": start_result,
            "status": start_result.get("status", "error")
        }
    
    def is_running(self) -> bool:
        """Check if ComfyUI process is running"""
        # Check if ComfyUI path is configured
        if not self.comfyui_path or not os.path.exists(self.comfyui_path):
            return False
            
        if self.process and self.process.poll() is None:
            return True
        
        # Also check if ComfyUI is running as a separate process
        try:
            response = requests.get(f"{self.api_url}/system_stats", timeout=1)
            return response.status_code == 200
        except Exception as e:
            # Log the error but don't raise it
            print(f"Error checking if ComfyUI is running: {str(e)}")
        
        return False
    
    def get_status(self) -> Dict[str, Any]:
        """Get the current status of ComfyUI"""
        # Check if ComfyUI path is configured
        if not self.comfyui_path or not os.path.exists(self.comfyui_path):
            return {
                "status": "not_configured",
                "message": "ComfyUI path not configured or does not exist",
                "comfyui_path": self.comfyui_path,
                "path_exists": os.path.exists(self.comfyui_path) if self.comfyui_path else False,
                "uptime": 0,
                "port": 8188,
                "url": self.api_url,
                "version": "Unknown",
                "queue": {
                    "pending": 0,
                    "processing": 0,
                    "completed": 0
                },
                "resources": {
                    "gpu_usage": 0,
                    "memory_usage": 0
                }
            }
        
        is_running = self.is_running()
        
        if is_running:
            self.status = "running"
        else:
            self.status = "stopped"
        
        result = {
            "status": self.status,
            "uptime": int(time.time() - self.start_time) if self.start_time > 0 else 0,
            "port": int(self.api_url.split(":")[-1]) if self.api_url else 8188,
            "url": self.api_url,
            "version": "Unknown",
            "queue": {
                "pending": 0,
                "processing": 0,
                "completed": 0
            },
            "resources": {
                "gpu_usage": 0,
                "memory_usage": 0
            }
        }
        
        # If running, try to get more detailed status
        if is_running:
            try:
                # Get system stats
                response = requests.get(f"{self.api_url}/system_stats", timeout=1)
                if response.status_code == 200:
                    stats = response.json()
                    result["resources"]["gpu_usage"] = stats.get("cuda", {}).get("gpu_usage", 0)
                    result["resources"]["memory_usage"] = stats.get("cuda", {}).get("vram_used", 0)
                
                # Get queue status
                response = requests.get(f"{self.api_url}/queue", timeout=1)
                if response.status_code == 200:
                    queue = response.json()
                    result["queue"]["pending"] = len(queue.get("queue_running", []))
                    result["queue"]["processing"] = 1 if queue.get("queue_running", []) else 0
                    result["queue"]["completed"] = queue.get("queue_completed", 0)
                
                # Try to get version info
                response = requests.get(f"{self.api_url}/prompt", timeout=1)
                if response.status_code == 200:
                    # Version might be available in some ComfyUI API responses
                    # This is a placeholder as the actual endpoint might vary
                    result["version"] = "1.0.0"
            except Exception as e:
                result["error"] = str(e)
        
        return result
    
    def find_comfyui_processes(self) -> List[Dict[str, Any]]:
        """Find running ComfyUI processes"""
        comfyui_processes = []
        
        for proc in psutil.process_iter(['pid', 'name', 'cmdline', 'create_time']):
            try:
                cmdline = proc.info['cmdline']
                if cmdline and len(cmdline) > 1:
                    # Look for Python processes running main.py with ComfyUI in the path
                    if 'python' in cmdline[0].lower() and any('main.py' in arg for arg in cmdline):
                        if any('comfyui' in arg.lower() for arg in cmdline):
                            # Extract port if specified
                            port = 8188  # Default port
                            for arg in cmdline:
                                if arg.startswith('--port='):
                                    try:
                                        port = int(arg.split('=')[1])
                                    except:
                                        pass
                            
                            comfyui_processes.append({
                                "pid": proc.info['pid'],
                                "port": port,
                                "uptime": int(time.time() - proc.info['create_time']),
                                "command": ' '.join(cmdline)
                            })
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                pass
        
        return comfyui_processes
    
    def get_logs(self, max_lines: int = 100) -> Dict[str, Any]:
        """Get the logs from the ComfyUI process"""
        logs = {
            "stdout": [],
            "stderr": [],
            "status": self.status
        }
        
        # If process is running and we have access to its stdout/stderr
        if self.process and self.process.poll() is None and hasattr(self.process, 'stdout') and hasattr(self.process, 'stderr'):
            try:
                # Non-blocking read from stdout
                stdout_lines = []
                while len(stdout_lines) < max_lines:
                    line = self.process.stdout.readline()
                    if not line:
                        break
                    stdout_lines.append(line.strip())
                logs["stdout"] = stdout_lines
                
                # Non-blocking read from stderr
                stderr_lines = []
                while len(stderr_lines) < max_lines:
                    line = self.process.stderr.readline()
                    if not line:
                        break
                    stderr_lines.append(line.strip())
                logs["stderr"] = stderr_lines
            except Exception as e:
                logs["error"] = str(e)
        
        # If ComfyUI is not running through our manager, try to find log files
        elif self.comfyui_path and os.path.exists(self.comfyui_path):
            log_path = os.path.join(self.comfyui_path, "logs")
            if os.path.exists(log_path):
                # Look for the most recent log file
                log_files = [f for f in os.listdir(log_path) if f.endswith(".log")]
                if log_files:
                    # Sort by modification time (newest first)
                    log_files.sort(key=lambda x: os.path.getmtime(os.path.join(log_path, x)), reverse=True)
                    latest_log = os.path.join(log_path, log_files[0])
                    
                    try:
                        with open(latest_log, 'r') as f:
                            # Get the last max_lines lines
                            lines = f.readlines()[-max_lines:]
                            logs["stdout"] = [line.strip() for line in lines]
                    except Exception as e:
                        logs["error"] = f"Error reading log file: {str(e)}"
        
        # Add timestamp
        logs["timestamp"] = time.time()
        return logs
