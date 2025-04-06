import requests
import time
import json

# Base URL for the API
BASE_URL = "http://localhost:8000/api"

def test_system_endpoints():
    print("\n=== Testing System Endpoints ===")
    
    # Test system info endpoint
    response = requests.get(f"{BASE_URL}/system/info")
    print(f"System Info: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"  OS: {data.get('os', {}).get('name')} {data.get('os', {}).get('version')}")
        print(f"  CPU: {data.get('cpu', {}).get('name')}")
        print(f"  GPU: {data.get('gpu', {}).get('name')}")
    
    # Test system stats endpoint
    response = requests.get(f"{BASE_URL}/system/stats")
    print(f"System Stats: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"  CPU Usage: {data.get('cpu', {}).get('usage')}%")
        print(f"  RAM Usage: {data.get('memory', {}).get('percent')}%")
        print(f"  GPU Usage: {data.get('gpu', {}).get('usage')}%")
    
    # Test storage info endpoint
    response = requests.get(f"{BASE_URL}/system/storage")
    print(f"Storage Info: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"  Total Disk: {data.get('disk', {}).get('total')}")
        print(f"  Free Disk: {data.get('disk', {}).get('free')}")
        print(f"  Models Dir: {data.get('models_dir', {}).get('path')}")

def test_settings_endpoints():
    print("\n=== Testing Settings Endpoints ===")
    
    # Test get settings endpoint
    response = requests.get(f"{BASE_URL}/settings")
    print(f"Get Settings: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"  ComfyUI Path: {data.get('comfyUIPath', 'Not set')}")
        print(f"  Models Path: {data.get('modelsPath', 'Not set')}")
        print(f"  Theme: {data.get('theme', 'system')}")
    
    # Test update settings endpoint
    new_settings = {
        "theme": "dark",
        "refreshInterval": 3000
    }
    response = requests.post(f"{BASE_URL}/settings", json=new_settings)
    print(f"Update Settings: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"  Updated Theme: {data.get('theme')}")
        print(f"  Updated Refresh Interval: {data.get('refreshInterval')}")

def test_comfyui_endpoints():
    print("\n=== Testing ComfyUI Endpoints ===")
    
    # Test ComfyUI status endpoint
    response = requests.get(f"{BASE_URL}/comfyui/status")
    print(f"ComfyUI Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"  Status: {data.get('status')}")
        print(f"  Uptime: {data.get('uptime')} seconds")
        print(f"  URL: {data.get('url')}")
    
    # Test ComfyUI processes endpoint
    response = requests.get(f"{BASE_URL}/comfyui/processes")
    print(f"ComfyUI Processes: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"  Found {data.get('count', 0)} ComfyUI processes")

def test_models_endpoints():
    print("\n=== Testing Models Endpoints ===")
    
    # Test get installed models endpoint
    response = requests.get(f"{BASE_URL}/models/list")
    print(f"Installed Models: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"  Found {len(data)} installed models")
        if len(data) > 0:
            print(f"  First model: {data[0].get('name')} ({data[0].get('type')})")
    
    # Test search Civitai models endpoint
    response = requests.get(f"{BASE_URL}/models/search/civitai", params={"query": "realistic", "page": 1})
    print(f"Search Civitai: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"  Found {len(data.get('items', []))} models on Civitai")
        print(f"  Total items: {data.get('metadata', {}).get('totalItems', 0)}")

def test_custom_nodes_endpoints():
    print("\n=== Testing Custom Nodes Endpoints ===")
    
    # Test get installed custom nodes endpoint
    response = requests.get(f"{BASE_URL}/custom-nodes/list")
    print(f"Installed Custom Nodes: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"  Found {len(data)} installed custom nodes")
        if len(data) > 0:
            print(f"  First node: {data[0].get('name')} by {data[0].get('author')}")
    
    # Test search available custom nodes endpoint
    response = requests.get(f"{BASE_URL}/custom-nodes/search")
    print(f"Search Custom Nodes: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"  Found {len(data.get('items', []))} available custom nodes")

def main():
    print("ComfyUI Manager API Test")
    print("=======================\n")
    
    try:
        # Test root endpoint
        response = requests.get("http://localhost:8000/")
        if response.status_code == 200:
            print(f"API is running: {response.json().get('message')}")
        else:
            print("API is not responding correctly")
            return
        
        # Test all endpoint groups
        test_system_endpoints()
        test_settings_endpoints()
        test_comfyui_endpoints()
        test_models_endpoints()
        test_custom_nodes_endpoints()
        
        print("\n=======================")
        print("API Test Completed")
        
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to the API server")
        print("Make sure the server is running on http://localhost:8000")

if __name__ == "__main__":
    main()
