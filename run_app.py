#!/usr/bin/env python3
"""
TravelWise AI+ — Adaptive AI Travel Planner & Budget Guardian
Application Runner Script
"""

import os
import sys
from pathlib import Path

# Set working directory and Python path to backend
ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / 'backend'
sys.path.insert(0, str(BACKEND_DIR))

from app import create_app
from config import PORT, DEBUG

app = create_app()

if __name__ == '__main__':
    print("=" * 72)
    print("  🚀 TravelWise AI+ — Adaptive AI Travel Planner & Budget Guardian")
    print("=" * 72)
    print(f"  • Full-Stack Web App: http://localhost:{PORT}")
    print(f"  • API Health Endpoint: http://localhost:{PORT}/api/health")
    print(f"  • Database: {BACKEND_DIR / 'travelwise.db'} (SQLite)")
    print("  • Pre-seeded Evaluation Account:")
    print("      Email:    demo@travelwise.ai")
    print("      Password: Password123!")
    print("=" * 72)
    print("  Press Ctrl+C to stop the server.\n")

    app.run(host='0.0.0.0', port=PORT, debug=DEBUG)
