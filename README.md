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

- **Next.js**: React framework for building server-rendered applications
- **React**: JavaScript library for building user interfaces
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **SWR**: React Hooks library for data fetching with built-in caching and revalidation
- **Chart.js**: JavaScript charting library for visualizing data
- **Zustand**: Lightweight state management solution

#### Frontend Structure

```
src/
├── app/                 # Next.js app directory
│   ├── (dashboard)/      # Dashboard route group
│   │   ├── comfyui/       # ComfyUI management page
│   │   ├── custom-nodes/  # Custom nodes management page
│   │   ├── models/        # Models management page
│   │   └── settings/      # Settings page
│   ├── api/              # API route handlers
│   ├── layout.tsx        # Root layout component
│   └── page.tsx          # Home page component
├── components/          # Reusable React components
│   ├── DashboardStats.tsx # System stats dashboard component
│   ├── ModelManager.tsx   # Model management component
│   ├── Sidebar.tsx        # Navigation sidebar component
│   └── SettingsManager.tsx # Settings management component
├── hooks/               # Custom React hooks
├── services/            # API service modules
│   ├── comfyuiService.ts  # ComfyUI API service
│   ├── modelService.ts    # Models API service
│   ├── settingsService.ts # Settings API service
│   └── systemService.ts   # System monitoring API service
├── styles/              # Global styles
└── types/               # TypeScript type definitions
```

#### Key Features

- **Responsive Dashboard**: Adapts to different screen sizes for desktop and mobile use
- **Real-time Updates**: Live system statistics with customizable refresh intervals
- **Dark/Light Mode**: Theme support for user preference
- **Interactive Charts**: Visual representation of system resource usage
- **Intuitive Navigation**: Sidebar with easy access to all features

### Backend

The backend is built with:

- **FastAPI**: Modern, high-performance web framework for building APIs
- **Pydantic**: Data validation and settings management using Python type annotations
- **Uvicorn**: Lightning-fast ASGI server implementation
- **Psutil**: Cross-platform library for retrieving system information and process utilities
- **Python-dotenv**: For loading environment variables from .env files

#### Backend Structure

```
backend/
├── api/                  # API endpoints organized by feature
│   ├── comfyui.py       # ComfyUI process management endpoints
│   ├── custom_nodes.py  # Custom nodes management endpoints
│   ├── install.py       # Installation utilities endpoints
│   ├── models.py        # Model management endpoints
│   ├── settings.py      # Settings management endpoints
│   └── system.py        # System monitoring endpoints
├── data/                # Data storage directory
│   └── settings.json    # Application settings
├── utils/               # Utility modules
│   ├── comfyui.py       # ComfyUI process utilities
│   ├── custom_nodes.py  # Custom nodes management utilities
│   ├── models.py        # Model management utilities
│   ├── settings_manager.py # Settings management utilities
│   └── system_info.py   # System information utilities
├── main.py              # FastAPI application entry point
├── requirements.txt     # Python dependencies
└── run_server.py        # Server startup script
```

#### API Endpoints

The backend provides the following API endpoints:

- `/api/system`: System monitoring endpoints (CPU, RAM, GPU usage)
- `/api/models`: Model management endpoints (list, download, install)
- `/api/comfyui`: ComfyUI process management endpoints (start, stop, restart)
- `/api/settings`: Settings management endpoints (get, update)
- `/api/custom-nodes`: Custom nodes management endpoints (list, install, update)
- `/api/install`: Installation utilities endpoints

#### API Documentation

When the backend is running, you can access the API documentation at:

- Swagger UI: http://localhost:8618/docs
- ReDoc: http://localhost:8618/redoc

## Building for Production

To build the application for production:

```bash
npm run build
```

To start the production server:

```bash
npm start
```

## Setting Up on a New Server

When deploying ComfyDash on a new server, follow these steps to ensure proper configuration:

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-repo/comfydash.git
   cd comfydash
   ```

2. **Install Dependencies**
   ```bash
   # Install Node.js dependencies
   npm install
   
   # Install Python dependencies
   cd backend
   pip install -r requirements.txt
   cd ..
   ```

3. **Configure Backend**
   Create a `.env` file in the `backend` directory with the following content:
   ```
   API_PORT=8618
   COMFYUI_PATH=/absolute/path/to/your/comfyui
   ```
   
   Make sure to replace `/absolute/path/to/your/comfyui` with the actual path to your ComfyUI installation.

4. **Start the Application**
   There are several ways to start the application:
   
   - **Using the start script (recommended)**:
     - On Windows: `start.bat`
     - On Linux/macOS: `./start.sh`
   
   - **Using npm**:
     ```bash
     npm run dev
     ```
   
   - **Starting frontend and backend separately** (for debugging):
     ```bash
     # Terminal 1: Start backend
     npm run dev:backend
     
     # Terminal 2: Start frontend
     npm run dev:frontend
     ```

5. **Verify Both Servers Are Running**
   - Backend should be running on port 8618
   - Frontend should be running on port 8619
   - Open http://localhost:8619 in your browser

## Troubleshooting

### Connection Issues

If you encounter connection errors when starting ComfyDash, try the following steps:

1. **Verify Backend Server**
   - Make sure the backend server is running on port 8618
   - Check for any error messages in the terminal where you started the backend
   - Verify that the `.env` file in the backend directory has the correct configuration

2. **Check Port Availability**
   - Ensure ports 8618 (backend) and 8619 (frontend) are not being used by other applications
   - You can check using:
     ```bash
     # On Windows
     netstat -ano | findstr 8618
     netstat -ano | findstr 8619
     
     # On Linux/macOS
     netstat -tulpn | grep 8618
     netstat -tulpn | grep 8619
     ```

3. **Start Servers Separately**
   - Try starting the backend and frontend separately for debugging:
     ```bash
     # Start backend only
     cd backend
     python run_server.py
     
     # In another terminal, start frontend only
     npm run dev:frontend
     ```

4. **Check ComfyUI Path**
   - Ensure the `COMFYUI_PATH` in your `.env` file points to a valid ComfyUI installation

5. **Firewall Settings**
   - If running on a remote server, check that ports 8618 and 8619 are open in your firewall

### Common Errors

- **"Cannot read properties of undefined (reading 'length')"**: This usually indicates that the frontend cannot connect to the backend API. Check that the backend server is running.

- **"Failed to fetch settings: TypeError: Failed to fetch"**: The frontend cannot reach the backend API. Verify that the backend server is running on the correct port.

## License

MIT License
