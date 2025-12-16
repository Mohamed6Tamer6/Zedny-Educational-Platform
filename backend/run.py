#!/usr/bin/env python
"""
Script to run the FastAPI server with proper path configuration.
This ensures PYTHONPATH is set correctly so uvicorn can find the 'app' module.
"""
import os
import sys

# Get the backend directory (where this script is located)
backend_dir = os.path.dirname(os.path.abspath(__file__))

# Add backend directory to Python path
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Set PYTHONPATH environment variable
os.environ['PYTHONPATH'] = backend_dir

# Change working directory to backend
os.chdir(backend_dir)

# Now import and run uvicorn
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=8000,
        reload=True
    )

