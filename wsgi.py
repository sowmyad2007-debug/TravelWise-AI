#!/usr/bin/env python3
"""
WSGI Entrypoint for TravelWise AI+ Production Deployment (Render, Railway, Gunicorn)
"""
import os
import sys
from pathlib import Path

# Add backend directory to sys.path so modules resolve smoothly
ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / 'backend'
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app import create_app

# Expose WSGI application object for Gunicorn / uWSGI / Render
app = create_app()

if __name__ == '__main__':
    from config import PORT, DEBUG
    app.run(host='0.0.0.0', port=PORT, debug=DEBUG)
