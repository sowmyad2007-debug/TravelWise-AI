from flask import Blueprint, request, jsonify
from auth import require_auth
from database import get_db
from destination_data import get_destination_info, are_places_duplicate
from image_service import resolve_place_image

itineraries_bp = Blueprint('itineraries', __name__, url_prefix='/api/itineraries')

def verify_activity_ownership(activity_id: int, user_id: int):
    with get_db() as conn:
        row = conn.execute(
            """
            SELECT a.id, a.day_id, a.trip_id, t.destination, t.travel_style
            FROM itinerary_activities a
            JOIN trips t ON a.trip_id = t.id
            WHERE a.id = ? AND t.user_id = ?
            """,
            (activity_id, user_id)
        ).fetchone()
        return row

@itineraries_bp.route('/activities/<int:activity_id>', methods=['PUT'])
@require_auth
def update_activity(activity_id: int):
    act = verify_activity_ownership(activity_id, request.user_id)
    if not act:
        return jsonify({'error': 'Activity not found or unauthorized.'}), 404

    data = request.get_json() or {}
    name = data.get('name')
    description = data.get('description')
    time_slot = data.get('time_slot')
    duration_hours = data.get('duration_hours')
    estimated_entry_cost = data.get('estimated_entry_cost')
    estimated_transport_cost = data.get('estimated_transport_cost')
    interest_match_reason = data.get('interest_match_reason')

    fields = []
    params = []
    if name is not None:
        fields.append("name = ?")
        params.append(name.strip())
    if description is not None:
        fields.append("description = ?")
        params.append(description.strip())
    if time_slot is not None:
        fields.append("time_slot = ?")
        params.append(time_slot.strip())
    if duration_hours is not None:
        fields.append("duration_hours = ?")
        params.append(float(duration_hours))
    if estimated_entry_cost is not None:
        fields.append("estimated_entry_cost = ?")
        params.append(float(estimated_entry_cost))
    if estimated_transport_cost is not None:
        fields.append("estimated_transport_cost = ?")
        params.append(float(estimated_transport_cost))
    if interest_match_reason is not None:
        fields.append("interest_match_reason = ?")
        params.append(interest_match_reason.strip())

    if fields:
        params.append(activity_id)
        with get_db() as conn:
            conn.execute(f"UPDATE itinerary_activities SET {', '.join(fields)} WHERE id = ?", tuple(params))

    return jsonify({'message': 'Activity updated successfully.'}), 200

@itineraries_bp.route('/activities/<int:activity_id>', methods=['DELETE'])
@require_auth
def delete_activity(activity_id: int):
    act = verify_activity_ownership(activity_id, request.user_id)
    if not act:
        return jsonify({'error': 'Activity not found or unauthorized.'}), 404

    with get_db() as conn:
        conn.execute("DELETE FROM itinerary_activities WHERE id = ?", (activity_id,))

    return jsonify({'message': 'Activity removed from itinerary.'}), 200

@itineraries_bp.route('/activities/<int:activity_id>/replace', methods=['POST'])
@require_auth
def replace_activity(activity_id: int):
    act = verify_activity_ownership(activity_id, request.user_id)
    if not act:
        return jsonify({'error': 'Activity not found or unauthorized.'}), 404

    data = request.get_json() or {}
    replacement_type = data.get('type', 'cheaper') # cheaper, indoor, scenic, custom

    dest_info = get_destination_info(act['destination'], [], act['travel_style'])
    pool = dest_info.get('activities', [])

    # Fetch other active activities in this trip to prevent duplicate replacements
    with get_db() as conn:
        other_acts = conn.execute(
            "SELECT name, latitude, longitude, place_id FROM itinerary_activities WHERE trip_id = ? AND id != ? AND is_active = 1",
            (act['trip_id'], activity_id)
        ).fetchall()

    def is_dup(cand):
        for o in other_acts:
            if are_places_duplicate(
                cand.get('name', ''),
                o.get('name', ''),
                (cand.get('latitude'), cand.get('longitude')),
                (o.get('latitude'), o.get('longitude')),
                cand.get('place_id'),
                o.get('place_id')
            ):
                return True
        return False

    # Filter candidates based on replacement type
    candidates = []
    if replacement_type == 'cheaper':
        candidates = [a for a in pool if (a.get('estimated_entry_cost', 0) == 0 or a.get('cost_tier') in ['free', 'low'])]
    elif replacement_type == 'indoor':
        candidates = [a for a in pool if a.get('indoor')]
    else:
        candidates = pool

    # Exclude already scheduled attractions
    valid_candidates = [c for c in candidates if not is_dup(c)]
    if not valid_candidates:
        valid_candidates = [c for c in pool if not is_dup(c)]

    chosen = valid_candidates[0] if valid_candidates else None

    if not chosen:
        chosen = {
            "name": f"Relaxed Walking Tour in {act['destination']}",
            "description": "Scenic strolling through local gardens and markets.",
            "category": "relaxation",
            "time_slot": "02:00 PM - 04:00 PM",
            "duration_hours": 2.0,
            "estimated_entry_cost": 0.0,
            "estimated_transport_cost": 40.0,
            "reason": "Affordable, flexible replacement option without repeating attractions."
        }

    # Resolve genuine image
    img_data = resolve_place_image(
        chosen.get('name'),
        act['destination'],
        chosen.get('image_url'),
        chosen.get('photo_attribution')
    )
    final_img_url = img_data.get('image_url')
    final_attribution = img_data.get('photo_attribution')

    with get_db() as conn:
        conn.execute(
            """
            UPDATE itinerary_activities
            SET name = ?, description = ?, category = ?, estimated_entry_cost = ?,
                estimated_transport_cost = ?, interest_match_reason = ?, map_query = ?,
                image_url = ?, photo_attribution = ?, latitude = ?, longitude = ?,
                opening_hours = ?, weather_suitability = ?, transit_time_mins = ?,
                place_id = ?, source_url = ?, verification_status = ?, last_verified = ?
            WHERE id = ?
            """,
            (
                chosen.get('name'),
                chosen.get('description'),
                chosen.get('category', 'sightseeing'),
                chosen.get('estimated_entry_cost', 0.0),
                chosen.get('estimated_transport_cost', 50.0),
                f"Replaced ({replacement_type}): {chosen.get('reason', 'Great alternative')}",
                f"{chosen.get('name')}, {act['destination']}",
                final_img_url,
                final_attribution,
                chosen.get('latitude'),
                chosen.get('longitude'),
                chosen.get('opening_hours', 'Check current opening hours'),
                chosen.get('weather_suitability', 'all_weather'),
                chosen.get('transit_time_mins', 20),
                chosen.get('place_id'),
                chosen.get('source_url'),
                chosen.get('verification_status', 'verified'),
                chosen.get('last_verified', '2026-10-26'),
                activity_id
            )
        )

    chosen['image_url'] = final_img_url
    chosen['photo_attribution'] = final_attribution

    return jsonify({
        'message': f"Activity successfully replaced with {chosen.get('name')}.",
        'new_activity': chosen
    }), 200

@itineraries_bp.route('/days/<int:day_id>/activities', methods=['POST'])
@require_auth
def add_activity(day_id: int):
    with get_db() as conn:
        day = conn.execute(
            """
            SELECT d.id, d.trip_id, t.user_id, t.destination
            FROM itinerary_days d
            JOIN trips t ON d.trip_id = t.id
            WHERE d.id = ? AND t.user_id = ?
            """,
            (day_id, request.user_id)
        ).fetchone()

        if not day:
            return jsonify({'error': 'Day not found or unauthorized.'}), 404

        data = request.get_json() or {}
        name = (data.get('name') or '').strip()
        if not name:
            return jsonify({'error': 'Activity name is required.'}), 400

        desc = (data.get('description') or '').strip()
        category = (data.get('category') or 'sightseeing').strip()
        time_slot = (data.get('time_slot') or '10:00 AM - 12:00 PM').strip()
        duration_hours = float(data.get('duration_hours') or 2.0)
        entry_cost = float(data.get('estimated_entry_cost') or 0.0)
        transport_cost = float(data.get('estimated_transport_cost') or 0.0)
        reason = (data.get('interest_match_reason') or 'Custom activity added by you.').strip()

        img_data = resolve_place_image(name, day['destination'])
        final_img = img_data.get('image_url')
        final_attr = img_data.get('photo_attribution')

        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO itinerary_activities (
                day_id, trip_id, name, description, category, time_slot,
                duration_hours, estimated_entry_cost, estimated_transport_cost,
                visit_order, interest_match_reason, location_name, map_query, is_active,
                image_url, photo_attribution
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 99, ?, ?, ?, 1, ?, ?)
            """,
            (
                day['id'], day['trip_id'], name, desc, category, time_slot,
                duration_hours, entry_cost, transport_cost, reason, day['destination'],
                f"{name}, {day['destination']}", final_img, final_attr
            )
        )
        act_id = cursor.lastrowid

    return jsonify({'message': 'Activity added successfully.', 'activity_id': act_id}), 201
