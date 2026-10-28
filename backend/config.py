import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR.parent / '.env')
load_dotenv(BASE_DIR / '.env')

SECRET_KEY = os.getenv('SECRET_KEY', 'travelwise-super-secret-dev-key-change-in-prod-2026')
DATABASE_PATH = os.getenv('DATABASE_PATH', str(BASE_DIR / 'travelwise.db'))
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')
JWT_EXPIRATION_HOURS = int(os.getenv('JWT_EXPIRATION_HOURS', '24'))
RESET_TOKEN_EXPIRATION_MINUTES = int(os.getenv('RESET_TOKEN_EXPIRATION_MINUTES', '60'))
PORT = int(os.getenv('PORT', '5000'))
DEBUG = os.getenv('DEBUG', 'True').lower() in ('true', '1', 'yes')
