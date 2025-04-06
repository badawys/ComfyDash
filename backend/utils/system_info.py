import os
import platform
import psutil
import subprocess
import json
from typing import Dict, Any, List, Optional

# Get system information
def get_system_info() -> Dict[str, str]:
    """Get basic system information"""
    try:
        # Get GPU information if available
        gpu_info = get_gpu_info()
        gpu_name = gpu_info.get("name", "N/A")
        gpu_driver = gpu_info.get("driver", "N/A")
        
        # Get CPU information
        cpu_info = f"{platform.processor()} ({psutil.cpu_count(logical=True)} cores)"
        
        # Get RAM information
        ram = psutil.virtual_memory()
        total_ram = f"{ram.total / (1024**3):.2f} GB"
        
        # Get OS information
        os_info = f"{platform.system()} {platform.release()} ({platform.version()})"
        
        # Get Python version
        python_version = platform.python_version()
        
        return {
            "gpu_name": gpu_name,
            "gpu_driver": gpu_driver,
            "cpu_info": cpu_info,
            "total_ram": total_ram,
            "os_info": os_info,
            "python_version": python_version
        }
    except Exception as e:
        print(f"Error getting system info: {str(e)}")
        return {
            "gpu_name": "Error retrieving",
            "gpu_driver": "Error retrieving",
            "cpu_info": "Error retrieving",
            "total_ram": "Error retrieving",
            "os_info": "Error retrieving",
            "python_version": "Error retrieving"
        }

# Get GPU information
def get_gpu_info() -> Dict[str, str]:
    """Get GPU information using platform-specific methods"""
    system = platform.system()
    
    if system == "Windows":
        return get_gpu_info_windows()
    elif system == "Linux":
        return get_gpu_info_linux()
    elif system == "Darwin":  # macOS
        return get_gpu_info_macos()
    else:
        return {"name": "Unknown", "driver": "Unknown"}

def get_available_gpus() -> List[Dict[str, str]]:
    """Get a list of available GPUs"""
    system = platform.system()
    gpus = []
    
    try:
        if system == "Windows":
            # Use PowerShell to get GPU info
            cmd = "powershell \"Get-WmiObject Win32_VideoController | Select-Object Name, DriverVersion, DeviceID | ConvertTo-Json\""
            result = subprocess.run(cmd, capture_output=True, text=True, shell=True)
            
            if result.returncode == 0 and result.stdout.strip():
                # Parse the JSON output
                gpu_data = json.loads(result.stdout)
                
                # Handle both single GPU and multiple GPU cases
                if isinstance(gpu_data, list):
                    for i, gpu in enumerate(gpu_data):
                        gpus.append({
                            "id": gpu.get("DeviceID", str(i)),
                            "name": gpu.get("Name", f"GPU {i}"),
                            "driver": gpu.get("DriverVersion", "Unknown")
                        })
                else:
                    # Single GPU case
                    gpus.append({
                        "id": gpu_data.get("DeviceID", "0"),
                        "name": gpu_data.get("Name", "GPU 0"),
                        "driver": gpu_data.get("DriverVersion", "Unknown")
                    })
        elif system == "Linux":
            # Try nvidia-smi for NVIDIA GPUs
            try:
                cmd = "nvidia-smi --query-gpu=index,name,driver_version --format=csv,noheader"
                result = subprocess.run(cmd.split(), capture_output=True, text=True)
                
                if result.returncode == 0 and result.stdout.strip():
                    lines = result.stdout.strip().split('\n')
                    for line in lines:
                        parts = line.split(', ')
                        if len(parts) >= 3:
                            gpus.append({
                                "id": parts[0],
                                "name": parts[1],
                                "driver": parts[2]
                            })
            except:
                pass
                
            # If no NVIDIA GPUs found, try lspci for other GPUs
            if not gpus:
                try:
                    cmd = "lspci | grep -i 'vga\|3d\|display'"
                    result = subprocess.run(cmd, capture_output=True, text=True, shell=True)
                    
                    if result.returncode == 0 and result.stdout.strip():
                        lines = result.stdout.strip().split('\n')
                        for i, line in enumerate(lines):
                            if ': ' in line:
                                gpu_name = line.split(': ')[1].strip()
                                gpus.append({
                                    "id": str(i),
                                    "name": gpu_name,
                                    "driver": "Unknown"
                                })
                except:
                    pass
        elif system == "Darwin":  # macOS
            try:
                cmd = "system_profiler SPDisplaysDataType -json"
                result = subprocess.run(cmd.split(), capture_output=True, text=True)
                
                if result.returncode == 0 and result.stdout.strip():
                    data = json.loads(result.stdout)
                    displays = data.get("SPDisplaysDataType", [])
                    
                    for i, display in enumerate(displays):
                        gpu_name = display.get("sppci_model", f"GPU {i}")
                        gpus.append({
                            "id": str(i),
                            "name": gpu_name,
                            "driver": "macOS Built-in"
                        })
            except:
                pass
    except Exception as e:
        print(f"Error getting available GPUs: {str(e)}")
    
    # If no GPUs were found, add a default entry
    if not gpus:
        gpus.append({
            "id": "0",
            "name": "Default GPU",
            "driver": "Unknown"
        })
    
    return gpus

def get_gpu_info_windows() -> Dict[str, str]:
    """Get GPU information on Windows using WMI"""
    try:
        # Use PowerShell to get GPU info
        cmd = "powershell ""Get-WmiObject Win32_VideoController | Select-Object Name, DriverVersion | ConvertTo-Json"""
        result = subprocess.run(cmd, capture_output=True, text=True, shell=True)
        
        if result.returncode == 0 and result.stdout.strip():
            # Parse the JSON output
            gpu_data = json.loads(result.stdout)
            
            # Handle both single GPU and multiple GPU cases
            if isinstance(gpu_data, list):
                # Take the first GPU that seems to be a discrete GPU (NVIDIA, AMD, etc.)
                for gpu in gpu_data:
                    name = gpu.get("Name", "")
                    if "NVIDIA" in name or "AMD" in name or "Radeon" in name or "GeForce" in name:
                        return {
                            "name": name,
                            "driver": gpu.get("DriverVersion", "Unknown")
                        }
                # If no discrete GPU found, take the first one
                if gpu_data:
                    return {
                        "name": gpu_data[0].get("Name", "Unknown"),
                        "driver": gpu_data[0].get("DriverVersion", "Unknown")
                    }
            else:
                # Single GPU case
                return {
                    "name": gpu_data.get("Name", "Unknown"),
                    "driver": gpu_data.get("DriverVersion", "Unknown")
                }
    except Exception as e:
        print(f"Error getting Windows GPU info: {str(e)}")
    
    return {"name": "Unknown", "driver": "Unknown"}

def get_gpu_info_linux() -> Dict[str, str]:
    """Get GPU information on Linux using lspci and nvidia-smi"""
    try:
        # Try nvidia-smi first for NVIDIA GPUs
        try:
            cmd = "nvidia-smi --query-gpu=name,driver_version --format=csv,noheader"
            result = subprocess.run(cmd.split(), capture_output=True, text=True)
            
            if result.returncode == 0 and result.stdout.strip():
                parts = result.stdout.strip().split(", ")
                if len(parts) >= 2:
                    return {"name": parts[0], "driver": parts[1]}
        except:
            pass
        
        # Fallback to lspci for other GPUs
        cmd = "lspci | grep -i 'vga\|3d\|2d'"
        result = subprocess.run(cmd, capture_output=True, text=True, shell=True)
        
        if result.returncode == 0 and result.stdout.strip():
            # Extract GPU name from lspci output
            for line in result.stdout.strip().split('\n'):
                if "NVIDIA" in line or "AMD" in line or "Radeon" in line or "Intel" in line:
                    parts = line.split(': ')
                    if len(parts) >= 2:
                        return {"name": parts[1].strip(), "driver": "Unknown"}
    except Exception as e:
        print(f"Error getting Linux GPU info: {str(e)}")
    
    return {"name": "Unknown", "driver": "Unknown"}

def get_gpu_info_macos() -> Dict[str, str]:
    """Get GPU information on macOS using system_profiler"""
    try:
        cmd = "system_profiler SPDisplaysDataType | grep 'Chipset Model:'"
        result = subprocess.run(cmd, capture_output=True, text=True, shell=True)
        
        if result.returncode == 0 and result.stdout.strip():
            # Extract GPU name
            line = result.stdout.strip().split('\n')[0]
            parts = line.split(': ')
            if len(parts) >= 2:
                return {"name": parts[1].strip(), "driver": "Built-in"}
    except Exception as e:
        print(f"Error getting macOS GPU info: {str(e)}")
    
    return {"name": "Unknown", "driver": "Unknown"}

# Get system statistics
def get_system_stats(gpu_id: Optional[str] = None) -> Dict[str, Any]:
    """Get current system statistics (CPU, RAM, GPU usage)"""
    try:
        # Get CPU usage
        cpu_percent = psutil.cpu_percent(interval=0.1)
        
        # Get RAM usage
        ram = psutil.virtual_memory()
        ram_used = ram.used / (1024**3)  # GB
        ram_total = ram.total / (1024**3)  # GB
        
        # Get GPU usage if available
        gpu_stats = get_gpu_stats(gpu_id)
        
        # Ensure GPU stats has all required fields with default values if missing
        if "usage" not in gpu_stats:
            gpu_stats["usage"] = 0
        if "temperature" not in gpu_stats:
            gpu_stats["temperature"] = 0
        if "memory" not in gpu_stats:
            gpu_stats["memory"] = {"used": 0, "total": 0}
        elif "used" not in gpu_stats["memory"]:
            gpu_stats["memory"]["used"] = 0
        elif "total" not in gpu_stats["memory"]:
            gpu_stats["memory"]["total"] = 0
        
        return {
            "cpu": {
                "usage": cpu_percent,
                "cores": psutil.cpu_count(logical=True),
                "temperature": get_cpu_temperature()
            },
            "ram": {
                "used": round(ram_used, 2),
                "total": round(ram_total, 2),
                "percent": ram.percent
            },
            "gpu": gpu_stats,
            "timestamp": psutil.time.time()
        }
    except Exception as e:
        print(f"Error getting system stats: {str(e)}")
        return {
            "cpu": {"usage": 0, "cores": 0, "temperature": 0},
            "ram": {"used": 0, "total": 0, "percent": 0},
            "gpu": {"usage": 0, "temperature": 0, "memory": {"used": 0, "total": 0}},
            "timestamp": 0
        }

# Get GPU statistics
def get_gpu_stats(gpu_id: Optional[str] = None) -> Dict[str, Any]:
    """Get GPU usage statistics for the specified GPU ID"""
    system = platform.system()
    
    # Default values
    gpu_stats = {
        "usage": 0,
        "temperature": 0,
        "memory": {
            "used": 0,
            "total": 0
        },
        "name": "Unknown",
        "driver": "Unknown"
    }
    
    try:
        if system == "Windows" or system == "Linux":
            # Try to get NVIDIA GPU stats using nvidia-smi
            try:
                # If a specific GPU ID is provided, try to get stats for that GPU
                if gpu_id:
                    # First, get the GPU info to set name and driver
                    available_gpus = get_available_gpus()
                    for gpu in available_gpus:
                        if gpu["id"] == gpu_id:
                            gpu_stats["name"] = gpu["name"]
                            gpu_stats["driver"] = gpu["driver"]
                            break
                    
                    # For Windows, we need to map the device ID to nvidia-smi index
                    if system == "Windows" and gpu_id.startswith("VideoController"):
                        # Get all NVIDIA GPUs and their indices
                        cmd = "nvidia-smi --query-gpu=index,name --format=csv,noheader"
                        result = subprocess.run(cmd.split(), capture_output=True, text=True)
                        
                        if result.returncode == 0 and result.stdout.strip():
                            lines = result.stdout.strip().split('\n')
                            # Find the index of the selected GPU by matching the name
                            for line in lines:
                                parts = line.split(', ')
                                if len(parts) >= 2 and parts[1] in gpu_stats["name"]:
                                    # Use this index for the next query
                                    cmd = f"nvidia-smi --id={parts[0]} --query-gpu=utilization.gpu,temperature.gpu,memory.used,memory.total --format=csv,noheader,nounits"
                                    break
                    else:
                        # For Linux or if we can't map the ID, just use the ID directly if it's numeric
                        if gpu_id.isdigit():
                            cmd = f"nvidia-smi --id={gpu_id} --query-gpu=utilization.gpu,temperature.gpu,memory.used,memory.total --format=csv,noheader,nounits"
                else:
                    # No specific GPU ID, get stats for the first GPU
                    cmd = "nvidia-smi --query-gpu=utilization.gpu,temperature.gpu,memory.used,memory.total --format=csv,noheader,nounits"
                
                result = subprocess.run(cmd.split(), capture_output=True, text=True)
                
                if result.returncode == 0 and result.stdout.strip():
                    values = result.stdout.strip().split(', ')
                    if len(values) >= 4:
                        gpu_stats["usage"] = float(values[0])
                        gpu_stats["temperature"] = float(values[1])
                        gpu_stats["memory"]["used"] = float(values[2])
                        gpu_stats["memory"]["total"] = float(values[3])
                        return gpu_stats
            except:
                pass
            
            # If nvidia-smi fails, try platform-specific methods
            if system == "Windows":
                # Windows-specific fallback (limited info)
                pass
            elif system == "Linux":
                # Linux-specific fallback (limited info)
                pass
        elif system == "Darwin":  # macOS
            # macOS doesn't have easy access to GPU stats
            pass
    except Exception as e:
        print(f"Error getting GPU stats: {str(e)}")
    
    return gpu_stats

# Get CPU temperature
def get_cpu_temperature() -> float:
    """Get CPU temperature if available"""
    system = platform.system()
    
    try:
        if system == "Linux":
            # Try reading from thermal zone
            for i in range(10):  # Check first 10 thermal zones
                path = f"/sys/class/thermal/thermal_zone{i}/temp"
                if os.path.exists(path):
                    with open(path, 'r') as f:
                        temp = int(f.read().strip()) / 1000.0  # Convert from millidegrees to degrees
                        if temp > 0 and temp < 150:  # Sanity check
                            return temp
        elif system == "Windows":
            # Windows requires WMI, which is complex for direct Python access
            # This is a simplified approach that may not work on all systems
            try:
                cmd = "powershell ""Get-WmiObject MSAcpi_ThermalZoneTemperature -Namespace root/wmi | Select-Object CurrentTemperature | ConvertTo-Json"""
                result = subprocess.run(cmd, capture_output=True, text=True, shell=True)
                
                if result.returncode == 0 and result.stdout.strip():
                    data = json.loads(result.stdout)
                    if isinstance(data, list) and data:
                        temp = data[0].get("CurrentTemperature", 0)
                        return (temp / 10.0) - 273.15  # Convert from decikelvin to celsius
                    elif isinstance(data, dict):
                        temp = data.get("CurrentTemperature", 0)
                        return (temp / 10.0) - 273.15  # Convert from decikelvin to celsius
            except:
                pass
    except Exception as e:
        print(f"Error getting CPU temperature: {str(e)}")
    
    # Return a default value if temperature can't be determined
    return 0.0

# Get storage information
def get_available_storage_locations() -> List[Dict[str, Any]]:
    """Get a list of available storage locations (drives/partitions)"""
    storage_locations = []
    
    try:
        # Get all disk partitions
        partitions = psutil.disk_partitions(all=False)
        
        for i, partition in enumerate(partitions):
            try:
                # Skip CD-ROM drives with no media and other special devices
                if 'cdrom' in partition.opts or 'removable' in partition.opts:
                    if partition.mountpoint == '' or not os.path.exists(partition.mountpoint):
                        continue
                
                # Get disk usage for this partition
                usage = psutil.disk_usage(partition.mountpoint)
                total_gb = usage.total / (1024**3)  # GB
                
                # Skip very small partitions (less than 1GB) as they're likely system partitions
                if total_gb < 1:
                    continue
                
                # Add this partition to the list
                storage_locations.append({
                    "id": str(i),
                    "path": partition.mountpoint,
                    "device": partition.device,
                    "fstype": partition.fstype,
                    "total_gb": round(total_gb, 2),
                    "used_gb": round(usage.used / (1024**3), 2),
                    "free_gb": round(usage.free / (1024**3), 2),
                    "percent_used": usage.percent
                })
            except (PermissionError, FileNotFoundError):
                # Skip partitions we can't access
                continue
    except Exception as e:
        print(f"Error getting storage locations: {str(e)}")
    
    # If no storage locations were found, add a default entry
    if not storage_locations:
        storage_locations.append({
            "id": "0",
            "path": "/",
            "device": "Unknown",
            "fstype": "Unknown",
            "total_gb": 0,
            "used_gb": 0,
            "free_gb": 0,
            "percent_used": 0
        })
    
    return storage_locations

def get_storage_info(comfyui_path: Optional[str] = None, storage_path: Optional[str] = None) -> Dict[str, Any]:
    """Get storage information including disk space and directory sizes"""
    try:
        # Get disk usage for the specified path or main drive
        path_to_check = storage_path if storage_path and os.path.exists(storage_path) else '/'
        disk = psutil.disk_usage(path_to_check)
        disk_total = disk.total / (1024**3)  # GB
        disk_used = disk.used / (1024**3)  # GB
        disk_free = disk.free / (1024**3)  # GB
        
        result = {
            "disk_space": {
                "total": round(disk_total, 2),
                "used": round(disk_used, 2),
                "free": round(disk_free, 2),
                "percent": disk.percent
            }
        }
        
        # If ComfyUI path is provided, get directory sizes
        if comfyui_path and os.path.exists(comfyui_path):
            # Get models directory info
            models_dir = os.path.join(comfyui_path, "models")
            if os.path.exists(models_dir):
                models_size, models_files = get_directory_size(models_dir)
                result["models_directory"] = {
                    "path": models_dir,
                    "size": round(models_size / (1024**2), 2),  # MB
                    "files": models_files
                }
            
            # Get custom nodes directory info
            custom_nodes_dir = os.path.join(comfyui_path, "custom_nodes")
            if os.path.exists(custom_nodes_dir):
                nodes_size, nodes_files = get_directory_size(custom_nodes_dir)
                result["custom_nodes_directory"] = {
                    "path": custom_nodes_dir,
                    "size": round(nodes_size / (1024**2), 2),  # MB
                    "files": nodes_files
                }
        
        return result
    except Exception as e:
        print(f"Error getting storage info: {str(e)}")
        return {
            "disk_space": {
                "total": 0,
                "used": 0,
                "free": 0,
                "percent": 0
            }
        }

# Helper function to get directory size
def get_directory_size(path: str) -> tuple[float, int]:
    """Get the size of a directory and count of files"""
    total_size = 0
    file_count = 0
    
    for dirpath, dirnames, filenames in os.walk(path):
        for f in filenames:
            fp = os.path.join(dirpath, f)
            if os.path.exists(fp) and os.path.isfile(fp):
                total_size += os.path.getsize(fp)
                file_count += 1
    
    return total_size, file_count
