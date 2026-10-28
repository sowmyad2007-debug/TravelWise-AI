import re
import secrets
import hashlib
from datetime import datetime, timedelta, timezone
from functools import wraps
from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from config import SECRET_KEY, JWT_EXPIRATION_HOURS, RESET_TOKEN_EXPIRATION_MINUTES, DEBUG
from database import get_db

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# Simple in-memory rate limiter for login & reset attempts
RATE_LIMIT_STORE = {}

def is_rate_limited(key: str, limit: int = 5, window_seconds: int = 60) -> bool:
    try:
        if current_app and current_app.config.get('TESTING'):
            return False
    except Exception:
        pass
    now = datetime.now().timestamp()
    history = RATE_LIMIT_STORE.get(key, [])
    # Filter timestamps within window
    history = [t for t in history if now - t < window_seconds]
    if len(history) >= limit:
        RATE_LIMIT_STORE[key] = history
        return True
    history.append(now)
    RATE_LIMIT_STORE[key] = history
    return False

def generate_jwt(user_id: int, email: str) -> str:
    payload = {
        'sub': str(user_id),
        'email': email,
        'iat': datetime.now(timezone.utc),
        'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authentication required. Missing or invalid Bearer token.'}), 401
        
        token = auth_header.split(' ', 1)[1].strip()
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            user_id = int(payload.get('sub'))
            
            with get_db() as conn:
                user = conn.execute("SELECT id, name, email, preferred_currency, preferred_travel_style, preferred_interests FROM users WHERE id = ?", (user_id,)).fetchone()
            
            if not user:
                return jsonify({'error': 'User account not found.'}), 401
            
            request.user_id = user['id']
            request.user = user
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Session expired. Please log in again.'}), 401
        except Exception:
            return jsonify({'error': 'Invalid authentication token.'}), 401
        
        return f(*args, **kwargs)
    return decorated

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    name = (data.get('name') or '').strip()
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''
    confirm_password = data.get('confirm_password') or ''

    if not name or not email or not password:
        return jsonify({'error': 'Full name, email, and password are required.'}), 400

    if len(name) < 2:
        return jsonify({'error': 'Name must be at least 2 characters.'}), 400

    email_regex = r'^[\w\.-]+@[\w\.-]+\.\w+$'
    if not re.match(email_regex, email):
        return jsonify({'error': 'Please provide a valid email address.'}), 400

    if len(password) < 8:
        return jsonify({'error': 'Password must be at least 8 characters long.'}), 400

    if password != confirm_password:
        return jsonify({'error': 'Passwords do not match.'}), 400

    hashed_pw = generate_password_hash(password, method='scrypt')

    with get_db() as conn:
        existing = conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
        if existing:
            return jsonify({'error': 'An account with this email already exists. Please log in.'}), 409

        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
            (name, email, hashed_pw)
        )
        user_id = cursor.lastrowid
        user = conn.execute("SELECT id, name, email, preferred_currency, preferred_travel_style, preferred_interests FROM users WHERE id = ?", (user_id,)).fetchone()

    token = generate_jwt(user['id'], user['email'])
    return jsonify({
        'message': 'Account registered successfully.',
        'token': token,
        'user': user
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    client_ip = request.remote_addr or 'unknown'
    if is_rate_limited(f"login_{client_ip}", limit=10, window_seconds=60):
        return jsonify({'error': 'Too many login attempts. Please wait a minute and try again.'}), 429

    data = request.get_json() or {}
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''

    if not email or not password:
        return jsonify({'error': 'Email and password are required.'}), 400

    with get_db() as conn:
        user = conn.execute(
            "SELECT id, name, email, password_hash, preferred_currency, preferred_travel_style, preferred_interests FROM users WHERE email = ?",
            (email,)
        ).fetchone()

    if not user or not check_password_hash(user['password_hash'], password):
        # Generic message prevents email enumeration
        return jsonify({'error': 'Invalid email or password.'}), 401

    token = generate_jwt(user['id'], user['email'])
    user_data = {
        'id': user['id'],
        'name': user['name'],
        'email': user['email'],
        'preferred_currency': user['preferred_currency'],
        'preferred_travel_style': user['preferred_travel_style'],
        'preferred_interests': user['preferred_interests']
    }

    return jsonify({
        'message': 'Login successful.',
        'token': token,
        'user': user_data
    }), 200

@auth_bp.route('/me', methods=['GET'])
@require_auth
def get_current_user():
    return jsonify({'user': request.user}), 200

@auth_bp.route('/profile', methods=['PUT'])
@require_auth
def update_profile():
    data = request.get_json() or {}
    name = (data.get('name') or '').strip()
    preferred_currency = (data.get('preferred_currency') or 'INR').strip().upper()
    preferred_travel_style = (data.get('preferred_travel_style') or 'balanced').strip().lower()
    preferred_interests = data.get('preferred_interests')

    if not name:
        return jsonify({'error': 'Name cannot be empty.'}), 400

    import json
    interests_str = json.dumps(preferred_interests) if isinstance(preferred_interests, list) else (preferred_interests or '[]')

    with get_db() as conn:
        conn.execute(
            """
            UPDATE users
            SET name = ?, preferred_currency = ?, preferred_travel_style = ?, preferred_interests = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """,
            (name, preferred_currency, preferred_travel_style, interests_str, request.user_id)
        )
        updated_user = conn.execute(
            "SELECT id, name, email, preferred_currency, preferred_travel_style, preferred_interests FROM users WHERE id = ?",
            (request.user_id,)
        ).fetchone()

    return jsonify({'message': 'Profile updated successfully.', 'user': updated_user}), 200

@auth_bp.route('/change-password', methods=['POST'])
@require_auth
def change_password():
    data = request.get_json() or {}
    current_password = data.get('current_password') or ''
    new_password = data.get('new_password') or ''
    confirm_new_password = data.get('confirm_new_password') or ''

    if not current_password or not new_password:
        return jsonify({'error': 'Current password and new password are required.'}), 400

    if len(new_password) < 8:
        return jsonify({'error': 'New password must be at least 8 characters long.'}), 400

    if new_password != confirm_new_password:
        return jsonify({'error': 'New passwords do not match.'}), 400

    with get_db() as conn:
        user = conn.execute("SELECT password_hash FROM users WHERE id = ?", (request.user_id,)).fetchone()
        if not user or not check_password_hash(user['password_hash'], current_password):
            return jsonify({'error': 'Current password is incorrect.'}), 400

        new_hash = generate_password_hash(new_password, method='scrypt')
        conn.execute("UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (new_hash, request.user_id))

    return jsonify({'message': 'Password changed successfully.'}), 200

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    client_ip = request.remote_addr or 'unknown'
    if is_rate_limited(f"reset_{client_ip}", limit=5, window_seconds=60):
        return jsonify({'error': 'Too many password reset requests. Please wait a minute.'}), 429

    data = request.get_json() or {}
    email = (data.get('email') or '').strip().lower()

    if not email:
        return jsonify({'error': 'Email is required.'}), 400

    raw_token = None
    with get_db() as conn:
        user = conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
        if user:
            # Generate secure random token
            raw_token = secrets.token_urlsafe(32)
            token_hash = hashlib.sha256(raw_token.encode('utf-8')).hexdigest()
            expires_at = datetime.now(timezone.utc) + timedelta(minutes=RESET_TOKEN_EXPIRATION_MINUTES)
            
            conn.execute(
                "INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES (?, ?, ?)",
                (user['id'], token_hash, expires_at.strftime('%Y-%m-%d %H:%M:%S'))
            )

    # In development mode, provide a helper dev_token in response or log so local testers can reset without email config
    response_payload = {
        'message': 'If an account exists with that email address, password reset instructions have been generated.'
    }
    if raw_token and DEBUG:
        # Dev testing helper only enabled when DEBUG=True
        response_payload['dev_reset_token'] = raw_token
        response_payload['dev_note'] = 'Local dev helper: Use this token on the Reset Password page to complete the workflow without SMTP.'

    return jsonify(response_payload), 200

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json() or {}
    raw_token = (data.get('token') or '').strip()
    new_password = data.get('new_password') or ''
    confirm_password = data.get('confirm_password') or ''

    if not raw_token or not new_password:
        return jsonify({'error': 'Reset token and new password are required.'}), 400

    if len(new_password) < 8:
        return jsonify({'error': 'Password must be at least 8 characters long.'}), 400

    if new_password != confirm_password:
        return jsonify({'error': 'Passwords do not match.'}), 400

    token_hash = hashlib.sha256(raw_token.encode('utf-8')).hexdigest()

    with get_db() as conn:
        reset_row = conn.execute(
            """
            SELECT id, user_id, expires_at, used
            FROM password_resets
            WHERE token_hash = ?
            ORDER BY created_at DESC LIMIT 1
            """,
            (token_hash,)
        ).fetchone()

        if not reset_row:
            return jsonify({'error': 'Invalid or expired password reset token.'}), 400

        if reset_row['used']:
            return jsonify({'error': 'This password reset token has already been used.'}), 400

        try:
            exp_time = datetime.strptime(reset_row['expires_at'], '%Y-%m-%d %H:%M:%S')
            if datetime.now(timezone.utc).replace(tzinfo=None) > exp_time:
                return jsonify({'error': 'This password reset token has expired. Please request a new one.'}), 400
        except Exception:
            pass

        new_hash = generate_password_hash(new_password, method='scrypt')
        conn.execute("UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (new_hash, reset_row['user_id']))
        conn.execute("UPDATE password_resets SET used = 1 WHERE id = ?", (reset_row['id'],))

    return jsonify({'message': 'Password has been reset successfully. You may now log in with your new password.'}), 200

@auth_bp.route('/delete-account', methods=['DELETE'])
@require_auth
def delete_account():
    data = request.get_json() or {}
    confirmation = (data.get('confirmation') or '').strip()

    if confirmation != 'DELETE':
        return jsonify({'error': 'Please provide the confirmation string "DELETE" to permanently erase your account.'}), 400

    with get_db() as conn:
        conn.execute("DELETE FROM users WHERE id = ?", (request.user_id,))

    return jsonify({'message': 'Your account and all associated travel data have been permanently deleted.'}), 200
