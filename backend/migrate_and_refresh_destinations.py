"""
Migration and Database Refresh Script for TravelWise AI+ 2.0.
Ensures:
1. Safe backup of existing database before changes.
2. All trips have authentic verified destination cover images.
3. All itinerary activities have authentic verified images and photo attributions.
4. Zero duplicate attractions across all itinerary days.
5. 100% preservation of all existing user data, expenses, group splits, and adaptive history.
"""

import os
import shutil
import sqlite3
import json
import sys

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from destination_data import get_destination_info, are_places_duplicate
from image_service import resolve_place_image, is_valid_image_url

DB_PATH = os.path.join(os.path.dirname(__file__), "travelwise.db")
BACKUP_PATH = os.path.join(os.path.dirname(__file__), "travelwise.db.backup_expansion")

def migrate():
    if not os.path.exists(DB_PATH):
        print("Database file not found.")
        return

    # 1. Create a safe backup
    shutil.copy2(DB_PATH, BACKUP_PATH)
    print(f"Created safe database backup at: {BACKUP_PATH}")

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # 2. Update trips cover images
    trips = cursor.execute("SELECT id, destination, cover_image FROM trips").fetchall()
    trips_updated = 0
    for t in trips:
        dest_info = get_destination_info(t['destination'])
        hero_img = dest_info.get('hero_image')
        current_img = t['cover_image']
        
        # Check if current image is missing or invalid or broken 900px
        needs_update = False
        if not current_img or not is_valid_image_url(current_img):
            needs_update = True
        elif "upload.wikimedia.org" in current_img and "/900px-" in current_img:
            needs_update = True

        if needs_update and hero_img:
            cursor.execute("UPDATE trips SET cover_image = ? WHERE id = ?", (hero_img, t['id']))
            trips_updated += 1

    print(f"Updated cover images for {trips_updated} of {len(trips)} trips.")

    # 3. Update activities with authentic images and attributions
    activities = cursor.execute(
        """
        SELECT a.id, a.trip_id, a.name, a.image_url, a.photo_attribution, a.place_id, t.destination
        FROM itinerary_activities a
        JOIN trips t ON a.trip_id = t.id
        """
    ).fetchall()

    acts_updated = 0
    for act in activities:
        cur_img = act['image_url']
        needs_update = False
        if not cur_img or not is_valid_image_url(cur_img):
            needs_update = True
        elif "upload.wikimedia.org" in cur_img and "/900px-" in cur_img:
            needs_update = True

        if needs_update:
            res = resolve_place_image(act['name'], act['destination'])
            new_img = res.get('image_url')
            new_attr = res.get('photo_attribution')
            if new_img and new_img != cur_img:
                cursor.execute(
                    "UPDATE itinerary_activities SET image_url = ?, photo_attribution = ? WHERE id = ?",
                    (new_img, new_attr, act['id'])
                )
                acts_updated += 1

    print(f"Updated images for {acts_updated} of {len(activities)} activities.")

    # 4. Verify 0 duplicate activities across days in trips
    trip_ids = [t['id'] for t in trips]
    dups_resolved = 0
    for tid in trip_ids:
        trip_acts = cursor.execute(
            "SELECT id, name, latitude, longitude, place_id FROM itinerary_activities WHERE trip_id = ? AND is_active = 1 ORDER BY id ASC",
            (tid,)
        ).fetchall()
        seen = []
        for a in trip_acts:
            is_duplicate = False
            for s in seen:
                if are_places_duplicate(
                    a['name'], s['name'],
                    (a['latitude'], a['longitude']),
                    (s['latitude'], s['longitude']),
                    a['place_id'], s['place_id']
                ):
                    is_duplicate = True
                    break
            if is_duplicate:
                # Mark redundant duplicate inactive
                cursor.execute("UPDATE itinerary_activities SET is_active = 0 WHERE id = ?", (a['id'],))
                dups_resolved += 1
            else:
                seen.append(a)

    print(f"Deactivated {dups_resolved} redundant duplicate activities across historical trips.")

    conn.commit()
    conn.close()
    print("Database migration completed successfully!")

if __name__ == '__main__':
    migrate()
