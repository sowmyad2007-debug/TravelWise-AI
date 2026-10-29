import sqlite3
import json
from contextlib import contextmanager
from config import DATABASE_PATH

def dict_factory(cursor, row):
    d = {}
    for idx, col in enumerate(cursor.description):
        d[col[0]] = row[idx]
    return d

@contextmanager
def get_db():
    from pathlib import Path
    Path(DATABASE_PATH).parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = dict_factory
    conn.execute("PRAGMA foreign_keys = ON;")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def ensure_column_exists(cursor, table: str, column_def: str):
    """Safely adds a column to an existing SQLite table if not already present."""
    col_name = column_def.split()[0]
    cursor.execute(f"PRAGMA table_info({table});")
    cols = [c['name'] for c in cursor.fetchall()]
    if col_name not in cols:
        cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column_def};")

def init_db():
    with get_db() as conn:
        cursor = conn.cursor()
        
        # 1. Users
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL COLLATE NOCASE,
            password_hash TEXT NOT NULL,
            preferred_currency TEXT DEFAULT 'INR',
            preferred_travel_style TEXT DEFAULT 'balanced',
            preferred_interests TEXT DEFAULT '["nature", "food", "photography"]',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        ''')

        # 2. Password resets
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS password_resets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            token_hash TEXT NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            used INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        );
        ''')

        # 3. Trips
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS trips (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            starting_city TEXT NOT NULL,
            destination TEXT NOT NULL,
            start_date TEXT NOT NULL,
            end_date TEXT NOT NULL,
            travelers INTEGER DEFAULT 1,
            total_budget REAL NOT NULL,
            currency TEXT DEFAULT 'INR',
            travel_style TEXT DEFAULT 'balanced',
            interests TEXT NOT NULL,
            accommodation_pref TEXT DEFAULT 'budget_hotel',
            dietary_pref TEXT DEFAULT 'no_preference',
            accessibility_pref TEXT DEFAULT 'standard',
            cover_image TEXT,
            status TEXT DEFAULT 'planned',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        );
        ''')

        # 4. Itinerary Days
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS itinerary_days (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            trip_id INTEGER NOT NULL,
            day_number INTEGER NOT NULL,
            date TEXT,
            title TEXT,
            FOREIGN KEY (trip_id) REFERENCES trips (id) ON DELETE CASCADE
        );
        ''')

        # 5. Itinerary Activities
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS itinerary_activities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            day_id INTEGER NOT NULL,
            trip_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            category TEXT DEFAULT 'sightseeing',
            time_slot TEXT,
            duration_hours REAL DEFAULT 2.0,
            estimated_entry_cost REAL DEFAULT 0.0,
            estimated_transport_cost REAL DEFAULT 0.0,
            visit_order INTEGER DEFAULT 1,
            interest_match_reason TEXT,
            location_name TEXT,
            map_query TEXT,
            is_active INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (day_id) REFERENCES itinerary_days (id) ON DELETE CASCADE,
            FOREIGN KEY (trip_id) REFERENCES trips (id) ON DELETE CASCADE
        );
        ''')

        # 6. Expenses
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            trip_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            amount REAL NOT NULL,
            currency TEXT DEFAULT 'INR',
            date TEXT NOT NULL,
            notes TEXT,
            receipt_filename TEXT,
            payer_name TEXT DEFAULT 'You',
            is_shared INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (trip_id) REFERENCES trips (id) ON DELETE CASCADE
        );
        ''')

        # 7. Group Members
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS group_members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            trip_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            email TEXT,
            FOREIGN KEY (trip_id) REFERENCES trips (id) ON DELETE CASCADE
        );
        ''')

        # 8. Group Splits
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS group_splits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            expense_id INTEGER NOT NULL,
            member_name TEXT NOT NULL,
            share_amount REAL NOT NULL,
            FOREIGN KEY (expense_id) REFERENCES expenses (id) ON DELETE CASCADE
        );
        ''')

        # 9. Support Requests
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS support_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            category TEXT NOT NULL,
            subject TEXT NOT NULL,
            message TEXT NOT NULL,
            priority TEXT DEFAULT 'medium',
            status TEXT DEFAULT 'submitted_demo_mode',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
        );
        ''')

        # 10. Chat Messages
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS chat_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            trip_id INTEGER,
            user_id INTEGER NOT NULL,
            role TEXT NOT NULL,
            message TEXT NOT NULL,
            action_type TEXT,
            action_payload TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (trip_id) REFERENCES trips (id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        );
        ''')

        # 11. Itinerary Revisions History (Adaptive Intelligence 2.0 with Undo)
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS itinerary_revisions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            trip_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            scenario TEXT NOT NULL,
            summary TEXT NOT NULL,
            total_savings REAL DEFAULT 0.0,
            currency TEXT DEFAULT 'INR',
            changes_applied TEXT NOT NULL,
            snapshot_before TEXT NOT NULL,
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            can_undo INTEGER DEFAULT 1,
            FOREIGN KEY (trip_id) REFERENCES trips (id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        );
        ''')

        # 12. Receipts Vault & Expense Documentation
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS receipts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            trip_id INTEGER,
            expense_id INTEGER,
            title TEXT NOT NULL,
            merchant_name TEXT,
            amount REAL NOT NULL,
            currency TEXT DEFAULT 'INR',
            date TEXT NOT NULL,
            category TEXT NOT NULL,
            payment_method TEXT DEFAULT 'credit_card',
            notes TEXT,
            file_path TEXT NOT NULL,
            file_name TEXT NOT NULL,
            file_size INTEGER NOT NULL,
            mime_type TEXT NOT NULL,
            ocr_applied INTEGER DEFAULT 0,
            ocr_extracted_data TEXT,
            is_expense_created INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            FOREIGN KEY (trip_id) REFERENCES trips (id) ON DELETE SET NULL,
            FOREIGN KEY (expense_id) REFERENCES expenses (id) ON DELETE SET NULL
        );
        ''')

        # Non-destructive migrations for existing tables
        ensure_column_exists(cursor, 'itinerary_activities', 'opening_hours TEXT DEFAULT "09:00 AM - 06:00 PM"')
        ensure_column_exists(cursor, 'itinerary_activities', 'weather_suitability TEXT DEFAULT "all_weather"')
        ensure_column_exists(cursor, 'itinerary_activities', 'transit_time_mins INTEGER DEFAULT 20')
        ensure_column_exists(cursor, 'itinerary_activities', 'match_score INTEGER DEFAULT 88')
        ensure_column_exists(cursor, 'itinerary_activities', 'score_rationale TEXT')
        ensure_column_exists(cursor, 'itinerary_activities', 'image_url TEXT')
        ensure_column_exists(cursor, 'itinerary_activities', 'place_id TEXT')
        ensure_column_exists(cursor, 'itinerary_activities', 'photo_attribution TEXT')
        ensure_column_exists(cursor, 'itinerary_activities', 'latitude REAL')
        ensure_column_exists(cursor, 'itinerary_activities', 'longitude REAL')
        ensure_column_exists(cursor, 'itinerary_activities', 'source_url TEXT')
        ensure_column_exists(cursor, 'itinerary_activities', 'verification_status TEXT DEFAULT "verified"')
        ensure_column_exists(cursor, 'itinerary_activities', 'last_verified TEXT')

        ensure_column_exists(cursor, 'expenses', 'is_verified_price INTEGER DEFAULT 0')
        ensure_column_exists(cursor, 'expenses', 'receipt_url TEXT')
        ensure_column_exists(cursor, 'expenses', 'receipt_id INTEGER')

        ensure_column_exists(cursor, 'group_splits', 'split_type TEXT DEFAULT "equal"')
        ensure_column_exists(cursor, 'group_splits', 'percentage REAL DEFAULT 0.0')

        ensure_column_exists(cursor, 'trips', 'daily_budget_target REAL DEFAULT 0.0')
        ensure_column_exists(cursor, 'trips', 'last_weather_check TEXT')

        # Indexes for fast lookup
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_itinerary_days_trip_id ON itinerary_days(trip_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_activities_day_id ON itinerary_activities(day_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_expenses_trip_id ON expenses(trip_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_chat_trip_user ON chat_messages(trip_id, user_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_revisions_trip_user ON itinerary_revisions(trip_id, user_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_receipts_user ON receipts(user_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_receipts_trip ON receipts(trip_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_receipts_date ON receipts(date);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_receipts_expense ON receipts(expense_id);")

if __name__ == '__main__':
    init_db()
    print("Database initialized and migrated successfully.")
