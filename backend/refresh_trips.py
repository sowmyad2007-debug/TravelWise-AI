import sys
import os
import json
import sqlite3

sys.path.insert(0, os.path.dirname(__file__))

from database import get_db
from trips import generate_itinerary_for_trip

def refresh_all_trips():
    with get_db() as conn:
        cursor = conn.cursor()
        trips = cursor.execute("SELECT id, destination, start_date, end_date, travel_style, interests FROM trips").fetchall()
        print(f"Refreshing {len(trips)} existing trips...")
        for t in trips:
            trip_id = t['id']
            destination = t['destination']
            start_date = t['start_date']
            end_date = t['end_date']
            travel_style = t['travel_style'] or 'balanced'
            try:
                interests = json.loads(t['interests']) if isinstance(t['interests'], str) else (t['interests'] or [])
            except Exception:
                interests = []

            # Clear old days & activities
            cursor.execute("DELETE FROM itinerary_activities WHERE trip_id = ?", (trip_id,))
            cursor.execute("DELETE FROM itinerary_days WHERE trip_id = ?", (trip_id,))

            # Regenerate using deduplicated, verified generator
            generate_itinerary_for_trip(cursor, trip_id, destination, start_date, end_date, interests, travel_style)
            print(f"  [x] Refreshed Trip #{trip_id} ({destination})")
    print("All trips successfully updated with verified attractions, images, and coordinates.")

if __name__ == '__main__':
    refresh_all_trips()
