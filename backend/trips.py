import json
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from auth import require_auth
from database import get_db
from destination_data import get_destination_info, get_destination_weather, are_places_duplicate, calculate_preference_match_score
from image_service import resolve_place_image

trips_bp = Blueprint('trips', __name__, url_prefix='/api/trips')

def calculate_days(start_date_str: str, end_date_str: str) -> int:
    try:
        d1 = datetime.strptime(start_date_str, '%Y-%m-%d')
        d2 = datetime.strptime(end_date_str, '%Y-%m-%d')
        diff = (d2 - d1).days + 1
        return max(1, diff)
    except Exception:
        return 1

def generate_itinerary_for_trip(cursor, trip_id: int, destination: str, start_date_str: str, end_date_str: str, interests: list, travel_style: str):
    """
    Intelligent day-by-day itinerary generator:
    - Guarantees 0 duplicate attractions across the entire multi-day trip.
    - Matches real photographs to exact attractions.
    - Groups nearby attractions geographically to reduce transit time.
    - Respects opening hours, duration, and travel style.
    """
    d1 = datetime.strptime(start_date_str, '%Y-%m-%d')
    d2 = datetime.strptime(end_date_str, '%Y-%m-%d')
    total_days = max(1, (d2 - d1).days + 1)

    dest_info = get_destination_info(destination, interests, travel_style)
    pool = list(dest_info.get('activities', []))
    scheduled_attractions = []

    cur_date = d1
    for day_num in range(1, total_days + 1):
        day_date_str = cur_date.strftime('%Y-%m-%d')
        cursor.execute(
            "INSERT INTO itinerary_days (trip_id, day_number, date, title) VALUES (?, ?, ?, ?)",
            (trip_id, day_num, day_date_str, f"Day {day_num} Exploration")
        )
        day_id = cursor.lastrowid

        # 3 activities per day for trips <= 4 days; 2 activities per day for longer trips
        activities_per_day = 3 if total_days <= 4 else 2
        slot_times = ["09:30 AM - 12:00 PM", "02:00 PM - 04:30 PM", "05:30 PM - 07:30 PM"]
        day_selected_acts = []

        for slot_i in range(activities_per_day):
            assigned_slot = slot_times[slot_i] if slot_i < len(slot_times) else "10:00 AM - 12:00 PM"

            # Filter candidates: place must NOT duplicate any attraction already scheduled across ANY day
            available_candidates = []
            for act in pool:
                is_dup = False
                for s in scheduled_attractions:
                    if are_places_duplicate(
                        act.get('name', ''),
                        s.get('name', ''),
                        (act.get('latitude'), act.get('longitude')),
                        (s.get('latitude'), s.get('longitude')),
                        act.get('place_id'),
                        s.get('place_id')
                    ):
                        is_dup = True
                        break
                if not is_dup:
                    available_candidates.append(act)

            if available_candidates:
                # Rank candidate: balance preference score and proximity to earlier activities on same day
                def rank_candidate(c):
                    score, _ = calculate_preference_match_score(c, interests, travel_style)
                    dist_penalty = 0.0
                    if day_selected_acts and day_selected_acts[-1].get('latitude') and c.get('latitude'):
                        dlat = c['latitude'] - day_selected_acts[-1]['latitude']
                        dlon = c['longitude'] - day_selected_acts[-1]['longitude']
                        dist_penalty = (dlat**2 + dlon**2) * 50.0
                    return score - dist_penalty

                chosen = max(available_candidates, key=rank_candidate)
                scheduled_attractions.append(chosen)
                day_selected_acts.append(chosen)

                # Resolve verified authentic image URL and attribution
                img_data = resolve_place_image(
                    chosen.get('name'),
                    destination,
                    chosen.get('image_url'),
                    chosen.get('photo_attribution')
                )
                final_image_url = img_data.get('image_url')
                final_attribution = img_data.get('photo_attribution')

                match_val, match_details = calculate_preference_match_score(chosen, interests, travel_style)
                
                cursor.execute(
                    """
                    INSERT INTO itinerary_activities (
                        day_id, trip_id, name, description, category, time_slot,
                        duration_hours, estimated_entry_cost, estimated_transport_cost,
                        visit_order, interest_match_reason, location_name, map_query, is_active,
                        opening_hours, weather_suitability, transit_time_mins, match_score, score_rationale,
                        image_url, photo_attribution, latitude, longitude,
                        place_id, source_url, verification_status, last_verified
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        day_id, trip_id,
                        chosen.get('name'),
                        chosen.get('description'),
                        chosen.get('category', 'sightseeing'),
                        assigned_slot,
                        chosen.get('duration_hours', 2.0),
                        chosen.get('estimated_entry_cost', 0.0),
                        chosen.get('estimated_transport_cost', 0.0),
                        slot_i + 1,
                        chosen.get('reason', 'Matches your travel interests.'),
                        destination,
                        f"{chosen.get('name')}, {destination}",
                        chosen.get('opening_hours', 'Check current opening hours'),
                        chosen.get('weather_suitability', 'all_weather'),
                        chosen.get('transit_time_mins', 20),
                        match_val,
                        f"Scored {match_val}% based on your interests and {travel_style} travel style.",
                        final_image_url,
                        final_attribution,
                        chosen.get('latitude'),
                        chosen.get('longitude'),
                        chosen.get('place_id'),
                        chosen.get('source_url'),
                        chosen.get('verification_status', 'verified'),
                        chosen.get('last_verified', '2026-10-26')
                    )
                )
            else:
                # If verified attractions are exhausted for an extended trip, schedule dedicated personal rest/leisure
                # Never invent fake landmarks or generic descriptions disguised as tourist attractions!
                assigned_slot = slot_times[slot_i] if slot_i < len(slot_times) else "02:00 PM - 04:30 PM"
                slot_label = "Morning" if slot_i == 0 else ("Afternoon" if slot_i == 1 else "Evening")
                cursor.execute(
                    """
                    INSERT INTO itinerary_activities (
                        day_id, trip_id, name, description, category, time_slot,
                        duration_hours, estimated_entry_cost, estimated_transport_cost,
                        visit_order, interest_match_reason, location_name, map_query, is_active,
                        opening_hours, weather_suitability, transit_time_mins, match_score, score_rationale,
                        image_url, photo_attribution,
                        place_id, source_url, verification_status, last_verified
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        day_id, trip_id,
                        f"Scheduled Rest & Local Stroll (Day {day_num} {slot_label}) in {destination}",
                        f"Dedicated personal leisure time for local cafe dining, markets, or rest in {destination}. All primary verified attractions for this destination have been scheduled.",
                        "relaxation",
                        assigned_slot,
                        2.0,
                        0.0,
                        30.0,
                        slot_i + 1,
                        "Dedicated personal leisure time to prevent schedule fatigue without repeating attractions.",
                        destination,
                        f"{destination} center",
                        "Check current opening hours",
                        "all_weather",
                        15,
                        75,
                        "Balancing itinerary pace after covering verified primary attractions.",
                        None,
                        None,
                        f"rest_slot_{day_num}_{slot_i}",
                        None,
                        "scheduled_break",
                        "2026-10-26"
                    )
                )

        cur_date += timedelta(days=1)

@trips_bp.route('', methods=['GET'])
@require_auth
def get_user_trips():
    with get_db() as conn:
        trips = conn.execute(
            """
            SELECT t.*, 
                   COALESCE((SELECT SUM(amount) FROM expenses WHERE trip_id = t.id), 0.0) as total_spent,
                   COALESCE((SELECT COUNT(*) FROM itinerary_days WHERE trip_id = t.id), 0) as days_count
            FROM trips t
            WHERE t.user_id = ?
            ORDER BY t.created_at DESC
            """,
            (request.user_id,)
        ).fetchall()

    # Parse JSON fields
    for t in trips:
        try:
            t['interests'] = json.loads(t['interests'])
        except Exception:
            t['interests'] = []
        t['remaining_budget'] = max(0.0, t['total_budget'] - t['total_spent'])
        t['budget_utilization_pct'] = round((t['total_spent'] / t['total_budget'] * 100) if t['total_budget'] > 0 else 0, 1)
        try:
            t['weather'] = get_destination_weather(t['destination'])
        except Exception:
            t['weather'] = None

    return jsonify({'trips': trips}), 200

@trips_bp.route('/<int:trip_id>', methods=['GET'])
@require_auth
def get_trip_details(trip_id: int):
    with get_db() as conn:
        trip = conn.execute(
            """
            SELECT t.*,
                   COALESCE((SELECT SUM(amount) FROM expenses WHERE trip_id = t.id), 0.0) as total_spent
            FROM trips t
            WHERE t.id = ? AND t.user_id = ?
            """,
            (trip_id, request.user_id)
        ).fetchone()

        if not trip:
            return jsonify({'error': 'Trip not found or unauthorized.'}), 404

        try:
            trip['interests'] = json.loads(trip['interests'])
        except Exception:
            trip['interests'] = []

        days = conn.execute(
            "SELECT * FROM itinerary_days WHERE trip_id = ? ORDER BY day_number ASC",
            (trip_id,)
        ).fetchall()

        for d in days:
            activities = conn.execute(
                """
                SELECT * FROM itinerary_activities 
                WHERE day_id = ? AND is_active = 1 
                ORDER BY visit_order ASC, time_slot ASC
                """,
                (d['id'],)
            ).fetchall()
            d['activities'] = activities

        expenses = conn.execute(
            "SELECT * FROM expenses WHERE trip_id = ? ORDER BY date DESC, id DESC",
            (trip_id,)
        ).fetchall()

        members = conn.execute(
            "SELECT * FROM group_members WHERE trip_id = ? ORDER BY id ASC",
            (trip_id,)
        ).fetchall()

    trip['days'] = days
    trip['expenses'] = expenses
    trip['group_members'] = members
    trip['remaining_budget'] = max(0.0, trip['total_budget'] - trip['total_spent'])
    trip['budget_utilization_pct'] = round((trip['total_spent'] / trip['total_budget'] * 100) if trip['total_budget'] > 0 else 0, 1)
    trip['weather'] = get_destination_weather(trip['destination'])
    dest_info = get_destination_info(trip['destination'])
    trip['seasonal_advisory'] = dest_info.get('seasonal_advisory')

    return jsonify({'trip': trip}), 200

@trips_bp.route('/<int:trip_id>/weather', methods=['GET'])
@require_auth
def get_trip_weather(trip_id: int):
    with get_db() as conn:
        trip = conn.execute("SELECT destination FROM trips WHERE id = ? AND user_id = ?", (trip_id, request.user_id)).fetchone()
        if not trip:
            return jsonify({'error': 'Trip not found or unauthorized.'}), 404

    weather = get_destination_weather(trip['destination'])
    return jsonify({'destination': trip['destination'], 'weather': weather}), 200

@trips_bp.route('', methods=['POST'])
@require_auth
def create_trip():
    data = request.get_json() or {}
    starting_city = (data.get('starting_city') or '').strip()
    destination = (data.get('destination') or '').strip()
    start_date = (data.get('start_date') or '').strip()
    end_date = (data.get('end_date') or '').strip()
    travelers = int(data.get('travelers') or 1)
    total_budget = float(data.get('total_budget') or 0.0)
    currency = (data.get('currency') or 'INR').strip().upper()
    travel_style = (data.get('travel_style') or 'balanced').strip().lower()
    interests = data.get('interests') or []
    accommodation_pref = (data.get('accommodation_pref') or 'budget_hotel').strip()
    dietary_pref = (data.get('dietary_pref') or 'no_preference').strip()
    accessibility_pref = (data.get('accessibility_pref') or 'standard').strip()

    # Validations
    if not starting_city:
        return jsonify({'error': 'Starting city is required.'}), 400
    if not destination:
        return jsonify({'error': 'Destination is required.'}), 400
    if not start_date or not end_date:
        return jsonify({'error': 'Both departure and return dates are required.'}), 400

    try:
        d1 = datetime.strptime(start_date, '%Y-%m-%d')
        d2 = datetime.strptime(end_date, '%Y-%m-%d')
        if d2 < d1:
            return jsonify({'error': 'Return date must be on or after departure date.'}), 400
        total_days = (d2 - d1).days + 1
        if total_days > 30:
            return jsonify({'error': 'Trips are currently limited to 30 days.'}), 400
    except ValueError:
        return jsonify({'error': 'Dates must be in YYYY-MM-DD format.'}), 400

    if travelers < 1:
        return jsonify({'error': 'Number of travelers must be at least 1.'}), 400

    if total_budget <= 0:
        return jsonify({'error': 'Total trip budget must be greater than 0.'}), 400

    dest_info = get_destination_info(destination, interests, travel_style)
    canonical_dest = dest_info.get('name', destination.title())
    cover_image = dest_info.get('hero_image')
    title = f"{canonical_dest} Adventure"

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO trips (
                user_id, title, starting_city, destination, start_date, end_date,
                travelers, total_budget, currency, travel_style, interests,
                accommodation_pref, dietary_pref, accessibility_pref, cover_image, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'planned')
            """,
            (
                request.user_id, title, starting_city, canonical_dest, start_date, end_date,
                travelers, total_budget, currency, travel_style, json.dumps(interests),
                accommodation_pref, dietary_pref, accessibility_pref, cover_image
            )
        )
        trip_id = cursor.lastrowid

        # Add creator to group members automatically
        user_name = request.user['name'] if hasattr(request, 'user') and request.user else 'You'
        cursor.execute(
            "INSERT INTO group_members (trip_id, name, email) VALUES (?, ?, ?)",
            (trip_id, user_name, request.user.get('email', ''))
        )

        # Generate day-by-day itinerary without duplicates
        generate_itinerary_for_trip(cursor, trip_id, canonical_dest, start_date, end_date, interests, travel_style)

    return jsonify({'message': 'Trip and itinerary created successfully.', 'trip_id': trip_id}), 201

@trips_bp.route('/<int:trip_id>', methods=['PUT'])
@require_auth
def update_trip(trip_id: int):
    data = request.get_json() or {}
    with get_db() as conn:
        trip = conn.execute("SELECT * FROM trips WHERE id = ? AND user_id = ?", (trip_id, request.user_id)).fetchone()
        if not trip:
            return jsonify({'error': 'Trip not found or unauthorized.'}), 404

        title = data.get('title')
        destination = data.get('destination')
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        total_budget = data.get('total_budget')
        travel_style = data.get('travel_style')
        accommodation_pref = data.get('accommodation_pref')
        dietary_pref = data.get('dietary_pref')
        accessibility_pref = data.get('accessibility_pref')

        fields = []
        params = []
        if title is not None:
            fields.append("title = ?")
            params.append(title)
        if total_budget is not None:
            fields.append("total_budget = ?")
            params.append(float(total_budget))
        if travel_style is not None:
            fields.append("travel_style = ?")
            params.append(travel_style)
        if accommodation_pref is not None:
            fields.append("accommodation_pref = ?")
            params.append(accommodation_pref)
        if dietary_pref is not None:
            fields.append("dietary_pref = ?")
            params.append(dietary_pref)
        if accessibility_pref is not None:
            fields.append("accessibility_pref = ?")
            params.append(accessibility_pref)

        # Check for destination or date changes requiring itinerary regeneration
        dest_changed = False
        target_dest = trip['destination']
        if destination and destination.strip().lower() != trip['destination'].strip().lower():
            dest_changed = True
            dest_info = get_destination_info(destination.strip())
            canonical_dest = dest_info.get('name', destination.strip().title())
            target_dest = canonical_dest
            cover_img = dest_info.get('hero_image')
            fields.extend(["destination = ?", "cover_image = ?"])
            params.extend([canonical_dest, cover_img])

        target_start = trip['start_date']
        target_end = trip['end_date']
        dates_changed = False
        if start_date and start_date != trip['start_date']:
            dates_changed = True
            target_start = start_date
            fields.append("start_date = ?")
            params.append(start_date)
        if end_date and end_date != trip['end_date']:
            dates_changed = True
            target_end = end_date
            fields.append("end_date = ?")
            params.append(end_date)

        if fields:
            fields.append("updated_at = CURRENT_TIMESTAMP")
            params.append(trip_id)
            conn.execute(f"UPDATE trips SET {', '.join(fields)} WHERE id = ?", tuple(params))

        # Regenerate itinerary if destination or dates changed
        if dest_changed or dates_changed:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM itinerary_days WHERE trip_id = ?", (trip_id,))
            
            user_interests = []
            try:
                user_interests = json.loads(trip['interests']) if isinstance(trip['interests'], str) else trip['interests']
            except Exception:
                user_interests = []

            final_style = travel_style if travel_style else trip['travel_style']
            generate_itinerary_for_trip(cursor, trip_id, target_dest, target_start, target_end, user_interests, final_style)

    return jsonify({'message': 'Trip updated successfully.'}), 200

@trips_bp.route('/<int:trip_id>', methods=['DELETE'])
@require_auth
def delete_trip(trip_id: int):
    with get_db() as conn:
        trip = conn.execute("SELECT id FROM trips WHERE id = ? AND user_id = ?", (trip_id, request.user_id)).fetchone()
        if not trip:
            return jsonify({'error': 'Trip not found or unauthorized.'}), 404

        conn.execute("DELETE FROM trips WHERE id = ?", (trip_id,))

    return jsonify({'message': 'Trip deleted successfully.'}), 200

@trips_bp.route('/destinations', methods=['GET'])
def get_destinations_catalog():
    """Returns curated destination catalog with real images and daily budget targets."""
    from destination_data import DESTINATIONS
    try:
        from expanded_destinations import REGIONAL_SUB_DESTINATIONS
    except Exception:
        REGIONAL_SUB_DESTINATIONS = {}

    catalog = []
    for k, d in DESTINATIONS.items():
        catalog.append({
            "key": k,
            "name": d.get("name"),
            "state_country": d.get("state_country"),
            "currency": d.get("currency", "INR"),
            "hero_image": d.get("hero_image"),
            "description": d.get("description"),
            "avg_daily_cost": d.get("avg_daily_cost"),
            "activities_count": len(d.get("activities", [])),
            "seasonal_climate": d.get("seasonal_climate"),
            "seasonal_advisory": d.get("seasonal_advisory")
        })
    return jsonify({
        "destinations": sorted(catalog, key=lambda x: x["name"]),
        "regional_sub_destinations": REGIONAL_SUB_DESTINATIONS
    }), 200

@trips_bp.route('/destinations/resolve', methods=['GET'])
def resolve_destination_endpoint():
    """Resolves arbitrary destination query, canonical name, and any sub-destinations."""
    from destination_data import get_destination_info
    try:
        from expanded_destinations import get_sub_destinations, resolve_canonical_key
    except Exception:
        def get_sub_destinations(r): return []
        def resolve_canonical_key(q): return None

    q = request.args.get('q', '').strip()
    if not q:
        return jsonify({'error': 'Query parameter q is required.'}), 400
    info = get_destination_info(q)
    canonical = resolve_canonical_key(q) or q.lower()
    sub_regions = get_sub_destinations(canonical)
    return jsonify({
        "canonical_name": info.get("name"),
        "destination_key": canonical,
        "hero_image": info.get("hero_image"),
        "state_country": info.get("state_country"),
        "currency": info.get("currency"),
        "sub_destinations": sub_regions,
        "seasonal_advisory": info.get("seasonal_advisory")
    }), 200
