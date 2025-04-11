import os
import sys
import subprocess
import uvicorn
import json

# No longer using .env file, settings will be loaded from settings.json

def check_dependencies():
    """Check if all required dependencies are installed and install them if not."""
    try:
        import uvicorn
        import fastapi
        import pydantic
        import psutil
        import requests
        import dotenv
        print("All core dependencies are installed.")
        return True
    except ImportError as e:
        print(f"Missing dependency: {e.name}")
        print("Installing required dependencies...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
            print("Dependencies installed successfully.")
            return True
        except subprocess.CalledProcessError as e:
            print(f"Failed to install dependencies: {e}")
            return False

def ensure_data_directory():
    """Ensure the data directory exists for storing settings."""
    data_dir = os.path.join(os.path.dirname(__file__), "data")
    os.makedirs(data_dir, exist_ok=True)
    print(f"Data directory ensured at: {data_dir}")

def main():
    # Check dependencies first
    if not check_dependencies():
        print("Critical dependencies missing. Please install them manually.")
        print("Run: pip install -r requirements.txt")
        sys.exit(1)
    
    # Ensure data directory exists
    ensure_data_directory()
    
    # Get settings from settings.json
    settings_file = os.path.join(os.path.dirname(__file__), "data", "settings.json")
    try:
        if os.path.exists(settings_file):
            with open(settings_file, 'r') as f:
                settings = json.load(f)
            port = settings.get("apiPort", 8618)
            debug = settings.get("debug", True)
        else:
            # Default settings if file doesn't exist yet
            port = 8618
            debug = True
    except Exception as e:
        print(f"Error loading settings: {str(e)}")
        port = 8618
        debug = True
    
    print(f"Starting ComfyDash API on port {port}...")
    print("Press Ctrl+C to stop the server")
    
    # Run the API server
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=debug)

if __name__ == "__main__":
    main()
