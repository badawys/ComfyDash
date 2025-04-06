# ComfyUI Manager Backend

This is the backend API for the ComfyUI Manager application. It provides endpoints for managing ComfyUI, models, custom nodes, and system information.

## Setup

### Prerequisites

- Python 3.8 or higher
- ComfyUI installation

### Installation

1. Clone the repository or navigate to the backend directory
2. Install the required dependencies:

```bash
pip install -r requirements.txt
```

3. Configure the environment variables in the `.env` file:

```
# API Configuration
API_PORT=8000

# ComfyUI Configuration
COMFYUI_PATH=C:\path\to\comfyui
# MODELS_PATH=C:\path\to\comfyui\models  # Optional, defaults to COMFYUI_PATH/models
# CUSTOM_NODES_PATH=C:\path\to\comfyui\custom_nodes  # Optional, defaults to COMFYUI_PATH/custom_nodes

# Development Settings
DEBUG=true
ALLOW_CORS=true
```

### Running the Server

Run the server using the provided script:

```bash
python run_server.py
```

Or directly with uvicorn:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## API Documentation

Once the server is running, you can access the API documentation at:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Available Endpoints

#### System

- `GET /api/system/info` - Get system information (CPU, GPU, OS)
- `GET /api/system/stats` - Get system statistics (CPU, GPU, RAM usage)
- `GET /api/system/storage` - Get storage information

#### ComfyUI

- `GET /api/comfyui/status` - Get ComfyUI status
- `POST /api/comfyui/start` - Start ComfyUI
- `POST /api/comfyui/stop` - Stop ComfyUI
- `POST /api/comfyui/restart` - Restart ComfyUI
- `GET /api/comfyui/processes` - Find running ComfyUI processes
- `POST /api/comfyui/path` - Set ComfyUI path

#### Models

- `GET /api/models/list` - Get installed models
- `POST /api/models/download` - Start model download
- `GET /api/models/status/{download_id}` - Get download status
- `GET /api/models/downloads` - Get all active downloads
- `DELETE /api/models/download/{download_id}` - Cancel download
- `DELETE /api/models/delete` - Delete a model
- `GET /api/models/search/civitai` - Search models on Civitai
- `GET /api/models/search/huggingface` - Search models on HuggingFace

#### Custom Nodes

- `GET /api/custom-nodes/list` - Get installed custom nodes
- `POST /api/custom-nodes/install` - Install custom node
- `POST /api/custom-nodes/update` - Update custom node
- `DELETE /api/custom-nodes/uninstall` - Uninstall custom node
- `GET /api/custom-nodes/status/{install_id}` - Get installation status
- `GET /api/custom-nodes/installations` - Get all active installations
- `GET /api/custom-nodes/search` - Search available custom nodes

#### Settings

- `GET /api/settings` - Get current settings
- `POST /api/settings` - Update settings
- `GET /api/settings/export` - Export settings
- `POST /api/settings/import` - Import settings

## Project Structure

```
backend/
├── api/                  # API route handlers
│   ├── comfyui.py        # ComfyUI management endpoints
│   ├── custom_nodes.py   # Custom nodes management endpoints
│   ├── models.py         # Model management endpoints
│   ├── settings.py       # Settings management endpoints
│   └── system.py         # System information endpoints
├── data/                 # Data storage (created at runtime)
│   └── settings.json     # Application settings
├── utils/                # Utility functions
│   ├── comfyui_manager.py      # ComfyUI process management
│   ├── custom_nodes_manager.py # Custom nodes management
│   ├── model_manager.py        # Model download and management
│   ├── settings_manager.py     # Settings management
│   └── system_info.py          # System information utilities
├── .env                  # Environment variables
├── main.py               # Main FastAPI application
├── requirements.txt      # Python dependencies
└── run_server.py         # Server startup script
```

## Development

### Adding New Endpoints

To add new endpoints, create or modify files in the `api/` directory and register the router in `main.py`.

### Error Handling

The application includes a global exception handler that returns appropriate HTTP status codes and error messages.
