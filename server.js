const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Prepare Next.js app
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev, dir: __dirname });
const handle = app.getRequestHandler();

// Function to install Python dependencies
function installDependencies() {
  return new Promise((resolve, reject) => {
    console.log('Installing Python dependencies...');
    
    // Get the absolute path to the backend directory
    const backendPath = path.join(__dirname, 'backend');
    
    // Command to install dependencies
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
    const pipCmd = process.platform === 'win32' ? 'pip' : 'pip3';
    
    // Spawn the pip install process
    const installProcess = spawn(pipCmd, ['install', '-r', 'requirements.txt'], {
      cwd: backendPath,
      stdio: 'pipe',
      shell: true
    });
    
    // Log installation output
    installProcess.stdout.on('data', (data) => {
      console.log(`Pip: ${data}`);
    });
    
    installProcess.stderr.on('data', (data) => {
      console.error(`Pip error: ${data}`);
    });
    
    installProcess.on('close', (code) => {
      if (code === 0) {
        console.log('Python dependencies installed successfully');
        resolve();
      } else {
        console.error(`Pip install exited with code ${code}`);
        reject(new Error(`Failed to install dependencies (exit code ${code})`));
      }
    });
  });
}

// Function to start the Python backend server
function startBackendServer() {
  console.log('Starting Python backend server...');
  
  // Get the absolute path to the backend directory
  const backendPath = path.join(__dirname, 'backend');
  
  // Command to run the backend server
  const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
  
  // Spawn the backend process
  const backendProcess = spawn(pythonCmd, ['run_server.py'], {
    cwd: backendPath,
    stdio: 'pipe',
    shell: true
  });
  
  // Log backend output
  backendProcess.stdout.on('data', (data) => {
    console.log(`Backend: ${data}`);
  });
  
  backendProcess.stderr.on('data', (data) => {
    console.error(`Backend error: ${data}`);
  });
  
  backendProcess.on('close', (code) => {
    console.log(`Backend process exited with code ${code}`);
    if (code !== 0) {
      console.log('Attempting to restart backend server in 5 seconds...');
      setTimeout(startBackendServer, 5000);
    }
  });
  
  return backendProcess;
}

// Clear Next.js cache
function clearNextCache() {
  return new Promise((resolve) => {
    console.log('Clearing Next.js cache...');
    const cacheDir = path.join(__dirname, '.next/cache');
    
    if (fs.existsSync(cacheDir)) {
      try {
        // Use rimraf or fs.rmSync for Node.js 14.14.0+
        if (fs.rmSync) {
          fs.rmSync(cacheDir, { recursive: true, force: true });
        } else {
          // Fallback for older Node.js versions
          const { execSync } = require('child_process');
          execSync(`rimraf ${cacheDir}`);
        }
        console.log('Next.js cache cleared successfully');
      } catch (error) {
        console.error('Error clearing Next.js cache:', error);
      }
    } else {
      console.log('No Next.js cache found');
    }
    
    resolve();
  });
}

// Start the application
app.prepare().then(() => {
  // First clear cache, then install dependencies, then start the backend server
  clearNextCache()
    .then(() => installDependencies())
    .then(() => {
      // Start the backend server after dependencies are installed
      const backendProcess = startBackendServer();
      
      // Create the frontend server
      const server = createServer((req, res) => {
        const parsedUrl = parse(req.url, true);
        handle(req, res, parsedUrl);
      });
  
      // Start listening
      const port = parseInt(process.env.PORT || '8619', 10);
      server.listen(port, (err) => {
        if (err) throw err;
        console.log(`> Ready on http://localhost:${port}`);
      });
      
      // Handle graceful shutdown
      const handleShutdown = () => {
        console.log('Shutting down servers...');
        
        // Kill the backend process
        if (backendProcess) {
          backendProcess.kill();
        }
        
        // Close the frontend server
        server.close(() => {
          console.log('Frontend server closed');
          process.exit(0);
        });
      };
      
      // Handle termination signals
      process.on('SIGINT', handleShutdown);
      process.on('SIGTERM', handleShutdown);
    })
    .catch(error => {
      console.error('Failed to start backend:', error);
      process.exit(1);
    });
});
