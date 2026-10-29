import os
import json
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.security import generate_password_hash

from config import SECRET_KEY, PORT, DEBUG, CORS_ORIGINS
from database import init_db, get_db
from auth import auth_bp
from trips import trips_bp
from itineraries import itineraries_bp
from expenses import expenses_bp
from adaptive import adaptive_bp
from chatbot import chatbot_bp
from group_expenses import group_bp
from travel_helper import helper_bp
from receipts import receipts_bp
from destination_data import get_destination_info

def create_app():
    app = Flask(__name__, static_folder='../client/dist', static_url_path='')
    app.config['SECRET_KEY'] = SECRET_KEY

    # Enable CORS for frontend Vite dev server & production (Vercel, Render)
    origin_list = [o.strip() for o in CORS_ORIGINS.split(',') if o.strip()]
    if '*' in origin_list or not origin_list:
        CORS(app, resources={r"/api/*": {"origins": "*"}},
             allow_headers=["Content-Type", "Authorization", "X-Requested-With", "Accept"],
             methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
    else:
        CORS(app, resources={r"/api/*": {"origins": origin_list}},
             supports_credentials=True,
             allow_headers=["Content-Type", "Authorization", "X-Requested-With", "Accept"],
             methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

    @app.before_request
    def handle_options_preflight():
        from flask import request
        if request.method == 'OPTIONS' and request.path.startswith('/api/'):
            resp = app.make_default_options_response()
            req_origin = request.headers.get('Origin', '*')
            resp.headers['Access-Control-Allow-Origin'] = req_origin
            resp.headers['Access-Control-Allow-Credentials'] = 'true'
            resp.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Accept'
            resp.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
            return resp

    @app.after_request
    def add_cors_headers(response):
        from flask import request
        req_origin = request.headers.get('Origin')
        if req_origin:
            if '*' in origin_list or not origin_list or req_origin in origin_list or 'vercel.app' in req_origin or 'localhost' in req_origin:
                response.headers['Access-Control-Allow-Origin'] = req_origin
                response.headers['Access-Control-Allow-Credentials'] = 'true'
                response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Accept'
                response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        elif '*' in origin_list or not origin_list:
            response.headers['Access-Control-Allow-Origin'] = '*'
        return response

    # Initialize SQLite database
    init_db()

    # Register Blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(trips_bp)
    app.register_blueprint(itineraries_bp)
    app.register_blueprint(expenses_bp)
    app.register_blueprint(adaptive_bp)
    app.register_blueprint(chatbot_bp)
    app.register_blueprint(group_bp)
    app.register_blueprint(helper_bp)
    app.register_blueprint(receipts_bp)

    # Global Health Check & API Info
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'healthy',
            'service': 'TravelWise AI+ Adaptive Backend',
            'version': '2.0.0',
            'database': 'SQLite initialized',
            'gemini_configured': bool(os.getenv('GEMINI_API_KEY'))
        }), 200

    @app.route('/api/destinations', methods=['GET'])
    def api_destinations():
        from trips import get_destinations_catalog
        return get_destinations_catalog()

    @app.route('/api/destinations/resolve', methods=['GET'])
    def api_destinations_resolve():
        from trips import resolve_destination_endpoint
        return resolve_destination_endpoint()

    # Seed Demo Data if empty
    seed_demo_data()

    # Serve React SPA in production / preview
    @app.route('/assets/<path:filename>')
    def serve_assets(filename):
        assets_dir = os.path.join(app.static_folder, 'assets')
        target_path = os.path.join(assets_dir, filename)

        # 1. Exact match exists
        if os.path.exists(target_path):
            resp = send_from_directory(assets_dir, filename)
            resp.headers['Cache-Control'] = 'public, max-age=31536000, immutable'
            return resp

        # 2. Stale bundle hash fallback (e.g. cached browser asking for old chunk)
        if filename.endswith('.js') and os.path.exists(assets_dir):
            js_files = [f for f in os.listdir(assets_dir) if f.startswith('index-') and f.endswith('.js')]
            if js_files:
                resp = send_from_directory(assets_dir, js_files[0], mimetype='application/javascript')
                resp.headers['Cache-Control'] = 'no-cache, must-revalidate'
                return resp

        if filename.endswith('.css') and os.path.exists(assets_dir):
            css_files = [f for f in os.listdir(assets_dir) if f.startswith('index-') and f.endswith('.css')]
            if css_files:
                resp = send_from_directory(assets_dir, css_files[0], mimetype='text/css')
                resp.headers['Cache-Control'] = 'no-cache, must-revalidate'
                return resp

        # Never return index.html for missing assets - return 404
        return jsonify({'error': f'Asset not found: {filename}'}), 404

    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_spa(path):
        # Do not catch API routes or asset routes
        if path.startswith('api/'):
            return jsonify({'error': 'API endpoint not found'}), 404

        if path.startswith('assets/'):
            return jsonify({'error': 'Asset not found'}), 404

        # Specific static file request in root (e.g. favicon, manifest, robots.txt)
        if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)

        # SPA navigation fallback (return index.html with NO CACHE)
        index_file = os.path.join(app.static_folder, 'index.html')
        if os.path.exists(index_file):
            resp = send_from_directory(app.static_folder, 'index.html')
            resp.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate, max-age=0'
            resp.headers['Pragma'] = 'no-cache'
            resp.headers['Expires'] = '0'
            return resp
        else:
            return jsonify({
                'message': 'TravelWise AI+ API Server is running. Frontend Vite server is available on port 5173.',
                'endpoints': {
                    'health': '/api/health',
                    'auth': '/api/auth',
                    'trips': '/api/trips',
                    'helper': '/api/helper/resources'
                }
            })

    # Error Handlers
    @app.errorhandler(404)
    def not_found(e):
        if request_wants_json():
            return jsonify({'error': 'Resource not found'}), 404
        if os.path.exists(os.path.join(app.static_folder, 'index.html')):
            return send_from_directory(app.static_folder, 'index.html')
        return jsonify({'error': 'Resource not found'}), 404

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({'error': 'Internal server error. Please try again later.'}), 500

    @app.errorhandler(Exception)
    def handle_unhandled_exception(e):
        from werkzeug.exceptions import HTTPException
        if isinstance(e, HTTPException):
            return jsonify({'error': e.description}), e.code
        if DEBUG:
            app.logger.exception(e)
        return jsonify({'error': 'Internal server error. Please try again later.'}), 500

    return app

def request_wants_json():
    from flask import request
    return request.path.startswith('/api/')

def seed_demo_data():
    """Seeds a ready-to-test academic demo account with a 3-day Ooty trip."""
    with get_db() as conn:
        demo_user = conn.execute("SELECT id FROM users WHERE email = 'demo@travelwise.ai'").fetchone()
        if not demo_user:
            cursor = conn.cursor()
            hashed_pw = generate_password_hash('Password123!', method='scrypt')
            cursor.execute(
                """
                INSERT INTO users (name, email, password_hash, preferred_currency, preferred_travel_style, preferred_interests)
                VALUES ('Alex Chen', 'demo@travelwise.ai', ?, 'INR', 'balanced', '["nature", "photography", "food"]')
                """,
                (hashed_pw,)
            )
            user_id = cursor.lastrowid

            # Create sample 3-day Ooty trip
            dest_info = get_destination_info("Ooty", ["nature", "photography"], "balanced")
            cursor.execute(
                """
                INSERT INTO trips (
                    user_id, title, starting_city, destination, start_date, end_date,
                    travelers, total_budget, currency, travel_style, interests,
                    accommodation_pref, dietary_pref, accessibility_pref, cover_image, status
                ) VALUES (?, 'Ooty Misty Mountain Getaway', 'Bangalore', 'Ooty', '2026-11-10', '2026-11-12',
                          2, 8000.0, 'INR', 'balanced', '["nature", "photography", "food"]',
                          'budget_hotel', 'vegetarian', 'standard', ?, 'planned')
                """,
                (user_id, dest_info.get('hero_image'))
            )
            trip_id = cursor.lastrowid

            # Add group members
            cursor.execute("INSERT INTO group_members (trip_id, name, email) VALUES (?, 'Alex Chen', 'demo@travelwise.ai')", (trip_id,))
            cursor.execute("INSERT INTO group_members (trip_id, name, email) VALUES (?, 'Rohan Sharma', 'rohan@example.com')", (trip_id,))

            # Create 3 Days and activities
            acts = dest_info.get('activities', [])
            dates = ['2026-11-10', '2026-11-11', '2026-11-12']
            for day_idx, d_date in enumerate(dates):
                cursor.execute(
                    "INSERT INTO itinerary_days (trip_id, day_number, date, title) VALUES (?, ?, ?, ?)",
                    (trip_id, day_idx + 1, d_date, f"Day {day_idx + 1} Nilgiri Discovery")
                )
                day_id = cursor.lastrowid

                # Assign 2 activities per day
                for slot_idx in range(2):
                    act_data = acts[(day_idx * 2 + slot_idx) % len(acts)]
                    time_slot = "09:30 AM - 12:00 PM" if slot_idx == 0 else "03:00 PM - 05:30 PM"
                    cursor.execute(
                        """
                        INSERT INTO itinerary_activities (
                            day_id, trip_id, name, description, category, time_slot,
                            duration_hours, estimated_entry_cost, estimated_transport_cost,
                            visit_order, interest_match_reason, location_name, map_query, is_active,
                            image_url, photo_attribution
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Ooty', ?, 1, ?, ?)
                        """,
                        (
                            day_id, trip_id,
                            act_data['name'], act_data['description'], act_data.get('category', 'nature'),
                            time_slot, act_data.get('duration_hours', 2.0),
                            act_data.get('estimated_entry_cost', 0), act_data.get('estimated_transport_cost', 50),
                            slot_idx + 1, act_data.get('reason', 'Great match for nature lovers.'),
                            f"{act_data['name']}, Ooty",
                            act_data.get('image_url'), act_data.get('photo_attribution')
                        )
                    )

            # Seed realistic initial expenses
            cursor.execute(
                """
                INSERT INTO expenses (trip_id, title, category, amount, currency, date, notes, payer_name, is_shared)
                VALUES (?, 'KSRTC Express Bus Tickets', 'transport', 1400.0, 'INR', '2026-11-09', 'Bangalore to Ooty overnight bus for two', 'Alex Chen', 1)
                """,
                (trip_id,)
            )
            cursor.execute(
                """
                INSERT INTO expenses (trip_id, title, category, amount, currency, date, notes, payer_name, is_shared)
                VALUES (?, 'Hilltop Cottage Advance', 'accommodation', 2200.0, 'INR', '2026-11-09', 'One night deposit paid online', 'Alex Chen', 1)
                """,
                (trip_id,)
            )
            cursor.execute(
                """
                INSERT INTO expenses (trip_id, title, category, amount, currency, date, notes, payer_name, is_shared)
                VALUES (?, 'Traditional South Indian Breakfast', 'food', 350.0, 'INR', '2026-11-10', 'Dosa, Idli, and filter coffee at Charing Cross', 'Rohan Sharma', 1)
                """,
                (trip_id,)
            )

if __name__ == '__main__':
    app = create_app()
    print(f"TravelWise AI+ Backend running on port {PORT}...")
    app.run(host='0.0.0.0', port=PORT, debug=DEBUG)
