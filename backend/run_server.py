import os
import sys
import subprocess
import uvicorn
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

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
    
    # Get port from environment variable or use default
    port = int(os.getenv("API_PORT", 8618))
    
    print(f"Starting ComfyDash API on port {port}...")
    print("Press Ctrl+C to stop the server")
    
    # Run the API server
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)

if __name__ == "__main__":
    main()
