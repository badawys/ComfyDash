# ComfyDash

A comprehensive dashboard for monitoring and managing your ComfyUI environment. ComfyDash provides real-time system statistics, model management, and custom nodes installation all in one intuitive interface.

## Features

- **Real-time System Monitoring**: Track CPU, GPU, and RAM usage with customizable refresh intervals
- **GPU Selection**: Choose which GPU to monitor when multiple GPUs are available
- **Storage Management**: Monitor disk space and select specific storage locations
- **Model Management**: Download, install, and organize ComfyUI models
- **Custom Nodes Management**: Install, update, and remove custom nodes
- **ComfyUI Process Control**: Start, stop, and restart the ComfyUI process
- **Customizable Settings**: Configure paths, update intervals, and appearance

## Project Structure

ComfyDash follows a modern full-stack architecture:

1. **Frontend**: 
   - Built with Next.js and React
   - Styled with Tailwind CSS for a responsive design
   - Real-time data fetching with SWR
   - Interactive charts with Chart.js

2. **Backend**: 
   - FastAPI application providing RESTful API endpoints
   - System monitoring utilities for hardware stats
   - File system operations for model and custom node management

## Setup and Installation

### Prerequisites

- Node.js 18+ and npm
- Python 3.8+
- ComfyUI installation

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/comfydash.git
   cd comfydash
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Install backend dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

### Running the Application

1. Start the development server:

   #### Windows
   ```bash
   # Either double-click start.bat or run from command line:
   start.bat
   ```

   #### Linux/macOS
   ```bash
   # Make the script executable if needed
   chmod +x start.sh

   # Run the start script
   ./start.sh
   ```

   Alternatively, you can use npm directly:
   ```bash
   npm run dev
   ```

2. Open your browser and navigate to `http://localhost:8619`

### Configuration

You can configure ComfyDash by updating the settings in the UI or directly editing the `backend/data/settings.json` file.

### Port Configuration

ComfyDash runs on the following default ports:

- **Frontend**: 8619 (Next.js server)
- **Backend**: 8618 (FastAPI server)

You can change these ports by setting the following environment variables:

- Frontend port: Set the `PORT` environment variable
- Backend port: Set the `API_PORT` environment variable

Configure the backend by editing the `.env` file in the `backend` directory:

```
# API Configuration
API_PORT=8618

# ComfyUI Configuration
# Windows example
# COMFYUI_PATH=C:\path\to\comfyui

# Linux/macOS example
# COMFYUI_PATH=/path/to/comfyui

# Optional paths (if different from default locations)
# MODELS_PATH=/path/to/models  # Defaults to COMFYUI_PATH/models
# CUSTOM_NODES_PATH=/path/to/custom_nodes  # Defaults to COMFYUI_PATH/custom_nodes
```

## Running the Application

### Integrated Mode (Frontend + Backend)

Run the following command to start both the frontend and backend servers:

```bash
npm run dev
```

This will:
- Start the FastAPI backend server on port 8618
- Start the Next.js frontend server on port 8619
- Automatically handle communication between the two

Access the application at: http://localhost:8619

### Separate Mode

If you prefer to run the frontend and backend separately:

1. Start the backend:

```bash
npm run dev:backend
```

2. Start the frontend:

```bash
npm run dev:frontend
```

### Frontend

The frontend is built with:

- Next.js for the React framework
- Tailwind CSS for styling
- SWR for data fetching
- Chart.js for visualizations
- Zustand for state management

### Backend

The backend is built with:

- FastAPI for the API framework
- Pydantic for data validation
- Uvicorn as the ASGI server
- Various Python utilities for system monitoring and process management

## Building for Production

To build the application for production:

```bash
npm run build
```

To start the production server:

```bash
npm start
```

## License

MIT License
