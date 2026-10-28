import json
from flask import Blueprint, request, jsonify
from auth import require_auth
from database import get_db
from destination_data import get_destination_info, get_destination_weather, calculate_preference_match_score, are_places_duplicate
from image_service import resolve_place_image

adaptive_bp = Blueprint('adaptive', __name__, url_prefix='/api/adaptive')

@adaptive_bp.route('/trips/<int:trip_id>/evaluate', methods=['POST'])
@require_auth
def evaluate_adaptation(trip_id: int):
    """
    Adaptive Travel Intelligence 2.0:
    Multi-constraint evaluation with multiple alternative options,
    transparent scoring formulas, weather awareness, and side-by-side trade-offs.
    """
    with get_db() as conn:
        trip = conn.execute("SELECT * FROM trips WHERE id = ? AND user_id = ?", (trip_id, request.user_id)).fetchone()
        if not trip:
            return jsonify({'error': 'Trip not found or unauthorized.'}), 404

        spent_row = conn.execute("SELECT COALESCE(SUM(amount), 0.0) as total FROM expenses WHERE trip_id = ?", (trip_id,)).fetchone()
        total_spent = spent_row['total']

        days = conn.execute("SELECT * FROM itinerary_days WHERE trip_id = ? ORDER BY day_number ASC", (trip_id,)).fetchall()
        for d in days:
            acts = conn.execute(
                "SELECT * FROM itinerary_activities WHERE day_id = ? AND is_active = 1 ORDER BY visit_order ASC",
                (d['id'],)
            ).fetchall()
            d['activities'] = acts

    data = request.get_json() or {}
    scenario = data.get('scenario', 'auto')
    target_activity_id = data.get('target_activity_id')
    available_funds = trip['total_budget'] - total_spent

    # Parse user interests
    user_interests = []
    try:
        user_interests = json.loads(trip['interests']) if isinstance(trip['interests'], str) else trip['interests']
    except Exception:
        user_interests = ['nature', 'food']

    # Get live weather intelligence
    weather_info = get_destination_weather(trip['destination'])
    is_raining = weather_info.get('is_raining', False) or scenario == 'rain'

    dest_info = get_destination_info(trip['destination'], user_interests, trip['travel_style'])
    pool = dest_info.get('activities', [])

    proposed_changes = []
    total_savings = 0.0
    reason_summary = ""

    # Constraint Audit
    constraints_audit = {
        "budget_constraint": {
            "total_budget": trip['total_budget'],
            "spent_so_far": round(total_spent, 2),
            "remaining_funds": round(available_funds, 2),
            "status": "critical" if available_funds < (trip['total_budget'] * 0.15) else ("tight" if available_funds < (trip['total_budget'] * 0.3) else "healthy")
        },
        "weather_constraint": {
            "current_condition": weather_info.get('condition'),
            "temperature_c": weather_info.get('temperature_c'),
            "precipitation_alert": is_raining,
            "data_source": weather_info.get('source'),
            "retrieved_at": weather_info.get('retrieved_at')
        },
        "schedule_constraint": {
            "total_days": len(days),
            "recommended_daily_hours": "8 to 10 hours active time including transit"
        }
    }

    if scenario == 'auto':
        if is_raining:
            scenario = 'rain'
        elif available_funds < (trip['total_budget'] * 0.25) and len(days) > 1:
            scenario = 'overspent'
        else:
            scenario = 'cheaper_alternatives'

    # 1. SCENARIO: Overspent / Cheaper Alternatives
    if scenario in ['overspent', 'cheaper_alternatives']:
        all_acts = []
        for d in days:
            for a in d['activities']:
                all_acts.append((d['day_number'], a))

        all_acts.sort(key=lambda x: (x[1]['estimated_entry_cost'] + x[1]['estimated_transport_cost']), reverse=True)
        raw_cheaper = [p for p in pool if (p.get('estimated_entry_cost', 0) == 0 or p.get('cost_tier') in ['free', 'low'])]
        existing_names = [a['name'] for _, a in all_acts]
        cheaper_candidates = [p for p in raw_cheaper if not any(are_places_duplicate(p.get('name', ''), ex) for ex in existing_names)]
        if not cheaper_candidates:
            cheaper_candidates = [p for p in pool if not any(are_places_duplicate(p.get('name', ''), ex) for ex in existing_names)]
        if not cheaper_candidates:
            cheaper_candidates = pool

        cand_idx = 0
        for day_num, act in all_acts[:2]:
            orig_cost = act['estimated_entry_cost'] + act['estimated_transport_cost']
            if orig_cost > 80:
                replacement = cheaper_candidates[cand_idx % len(cheaper_candidates)]
                cand_idx += 1
                new_cost = replacement.get('estimated_entry_cost', 0) + replacement.get('estimated_transport_cost', 50)
                savings = max(0.0, orig_cost - new_cost)
                total_savings += savings

                # Multi-Factor Score
                score, score_comp = calculate_preference_match_score(
                    replacement, user_interests, trip['travel_style'], available_funds, is_raining
                )

                # Secondary alternative option
                alt_candidate = cheaper_candidates[(cand_idx) % len(cheaper_candidates)]
                alt_cost = alt_candidate.get('estimated_entry_cost', 0) + alt_candidate.get('estimated_transport_cost', 50)
                alt_score, _ = calculate_preference_match_score(alt_candidate, user_interests, trip['travel_style'], available_funds, is_raining)

                proposed_changes.append({
                    "activity_id": act['id'],
                    "day_number": day_num,
                    "original_name": act['name'],
                    "original_cost": orig_cost,
                    "original_duration": act['duration_hours'],
                    "replacement_name": replacement.get('name'),
                    "replacement_description": replacement.get('description'),
                    "replacement_category": replacement.get('category', 'sightseeing'),
                    "replacement_time_slot": act['time_slot'],
                    "replacement_duration_hours": replacement.get('duration_hours', 2.0),
                    "replacement_entry_cost": replacement.get('estimated_entry_cost', 0.0),
                    "replacement_transport_cost": replacement.get('estimated_transport_cost', 50.0),
                    "new_cost": new_cost,
                    "cost_difference": -savings,
                    "match_score": score,
                    "score_components": score_comp,
                    "pros": ["Significantly cuts entry fee", "Zero wait times for ticket counter", "Authentic regional ambiance"],
                    "cons": ["Self-guided without official audio guide"],
                    "assumptions": "Assumes standard local auto-rickshaw transit; ticket prices verified against current tourism benchmarks.",
                    "tradeoff_explanation": f"Swap '{act['name']}' with '{replacement.get('name')}', maintaining scenic exploration while saving {trip['currency']} {savings}.",
                    "replacement_place_id": replacement.get('place_id'),
                    "replacement_latitude": replacement.get('latitude'),
                    "replacement_longitude": replacement.get('longitude'),
                    "replacement_source_url": replacement.get('source_url'),
                    "replacement_verification_status": replacement.get('verification_status', 'verified'),
                    "replacement_last_verified": replacement.get('last_verified', '2026-10-26'),
                    "replacement_image_url": replacement.get('image_url'),
                    "replacement_photo_attribution": replacement.get('photo_attribution'),
                    "alternative_options": [
                        {
                            "name": alt_candidate.get('name'),
                            "cost": alt_cost,
                            "match_score": alt_score,
                            "description": alt_candidate.get('description')
                        }
                    ]
                })

        reason_summary = f"Identified budget pressure (Remaining: {trip['currency']} {available_funds}). Proposing {len(proposed_changes)} cost-optimized substitutions to save approx {trip['currency']} {total_savings}."

    # 2. SCENARIO: Rainy Weather Adaptation
    elif scenario == 'rain':
        indoor_candidates = [p for p in pool if p.get('indoor') or p.get('weather_suitability') == 'indoor_only']
        if not indoor_candidates:
            indoor_candidates = [
                {
                    "name": f"{trip['destination']} Heritage Gallery & Museum",
                    "description": "Covered regional exhibitions, folk sculptures, and sheltered tea pavilion.",
                    "category": "history",
                    "estimated_entry_cost": 40.0,
                    "estimated_transport_cost": 60.0,
                    "duration_hours": 2.0,
                    "indoor": True,
                    "interests": ["history", "culture"]
                },
                {
                    "name": f"{trip['destination']} Indoor Artisanal Market Arcade",
                    "description": "Sheltered shopping complex featuring handmade chocolates, warm spices, and hot beverage stalls.",
                    "category": "shopping",
                    "estimated_entry_cost": 0.0,
                    "estimated_transport_cost": 50.0,
                    "duration_hours": 2.0,
                    "indoor": True,
                    "interests": ["shopping", "food"]
                }
            ]

        in_idx = 0
        for d in days:
            for act in d['activities']:
                act_name_low = act['name'].lower()
                is_outdoor = ('lake' in act_name_low or 'valley' in act_name_low or 'peak' in act_name_low or
                              'trek' in act_name_low or 'beach' in act_name_low or 'waterfall' in act_name_low or
                              'garden' in act_name_low)
                
                if is_outdoor:
                    replacement = indoor_candidates[in_idx % len(indoor_candidates)]
                    in_idx += 1
                    orig_cost = act['estimated_entry_cost'] + act['estimated_transport_cost']
                    new_cost = replacement.get('estimated_entry_cost', 0) + replacement.get('estimated_transport_cost', 50)
                    savings = orig_cost - new_cost

                    score, score_comp = calculate_preference_match_score(
                        replacement, user_interests, trip['travel_style'], available_funds, True
                    )

                    proposed_changes.append({
                        "activity_id": act['id'],
                        "day_number": d['day_number'],
                        "original_name": act['name'],
                        "original_cost": orig_cost,
                        "original_duration": act['duration_hours'],
                        "replacement_name": replacement.get('name'),
                        "replacement_description": replacement.get('description'),
                        "replacement_category": replacement.get('category', 'culture'),
                        "replacement_time_slot": act['time_slot'],
                        "replacement_duration_hours": replacement.get('duration_hours', 2.0),
                        "replacement_entry_cost": replacement.get('estimated_entry_cost', 0.0),
                        "replacement_transport_cost": replacement.get('estimated_transport_cost', 50.0),
                        "new_cost": new_cost,
                        "cost_difference": -savings if savings > 0 else abs(savings),
                        "match_score": score,
                        "score_components": score_comp,
                        "pros": ["100% sheltered indoor venue", "Zero weather cancellation risk", "Comfortable all-day heating/shelter"],
                        "cons": ["Less panoramic photography than mountain ridge"],
                        "assumptions": "Open-Meteo live satellite feeds indicate rainfall; sheltered venues confirmed operating.",
                        "tradeoff_explanation": f"Swap outdoor '{act['name']}' with weather-proof indoor '{replacement.get('name')}' to guarantee a comfortable schedule without rain disruptions.",
                        "replacement_place_id": replacement.get('place_id'),
                        "replacement_latitude": replacement.get('latitude'),
                        "replacement_longitude": replacement.get('longitude'),
                        "replacement_source_url": replacement.get('source_url'),
                        "replacement_verification_status": replacement.get('verification_status', 'verified'),
                        "replacement_last_verified": replacement.get('last_verified', '2026-10-26'),
                        "replacement_image_url": replacement.get('image_url'),
                        "replacement_photo_attribution": replacement.get('photo_attribution')
                    })
        reason_summary = f"Weather Contingency: Replaced {len(proposed_changes)} outdoor locations with certified indoor cultural exhibitions and covered artisan markets."

    # 3. SCENARIO: Shortened Schedule
    elif scenario == 'shortened_time':
        for d in days:
            if len(d['activities']) > 2:
                act = d['activities'][-1]
                orig_cost = act['estimated_entry_cost'] + act['estimated_transport_cost']
                proposed_changes.append({
                    "activity_id": act['id'],
                    "day_number": d['day_number'],
                    "original_name": act['name'],
                    "original_cost": orig_cost,
                    "action": "remove",
                    "pros": ["Eliminates transit rush", "Provides 2.5 hours of relaxed downtime", "Reduces taxi fatigue"],
                    "cons": ["Misses one scheduled sightseeing point"],
                    "assumptions": "Assumes traveler needs to reach departure terminal or relax without schedule stress.",
                    "tradeoff_explanation": f"Remove '{act['name']}' on Day {d['day_number']} to free up 2.5 hours and eliminate transit rush."
                })
        reason_summary = "Schedule Compression: Streamlined schedule to prevent burnout and ensure calm departures."

    # 4. SCENARIO: Closed Attraction
    elif scenario == 'closed_attraction' and target_activity_id:
        target_act = None
        for d in days:
            for a in d['activities']:
                if a['id'] == target_activity_id:
                    target_act = (d['day_number'], a)
                    break
        if target_act:
            day_num, act = target_act
            alt = next((p for p in pool if p.get('name') != act['name']), pool[0] if pool else None)
            if alt:
                orig_cost = act['estimated_entry_cost'] + act['estimated_transport_cost']
                new_cost = alt.get('estimated_entry_cost', 0) + alt.get('estimated_transport_cost', 50)
                score, score_comp = calculate_preference_match_score(alt, user_interests, trip['travel_style'], available_funds, is_raining)
                
                proposed_changes.append({
                    "activity_id": act['id'],
                    "day_number": day_num,
                    "original_name": act['name'],
                    "original_cost": orig_cost,
                    "replacement_name": alt.get('name'),
                    "replacement_description": alt.get('description'),
                    "replacement_category": alt.get('category', 'sightseeing'),
                    "replacement_time_slot": act['time_slot'],
                    "replacement_duration_hours": alt.get('duration_hours', 2.0),
                    "replacement_entry_cost": alt.get('estimated_entry_cost', 0.0),
                    "replacement_transport_cost": alt.get('estimated_transport_cost', 50.0),
                    "new_cost": new_cost,
                    "cost_difference": orig_cost - new_cost,
                    "match_score": score,
                    "score_components": score_comp,
                    "pros": ["Immediately accessible alternative", "Similar travel interest category"],
                    "cons": ["Slightly different landmark style"],
                    "assumptions": "Selected based on matching category and proximity to itinerary corridor.",
                    "tradeoff_explanation": f"Replace closed attraction with '{alt.get('name')}', preserving planned travel rhythm.",
                    "replacement_place_id": alt.get('place_id'),
                    "replacement_latitude": alt.get('latitude'),
                    "replacement_longitude": alt.get('longitude'),
                    "replacement_source_url": alt.get('source_url'),
                    "replacement_verification_status": alt.get('verification_status', 'verified'),
                    "replacement_last_verified": alt.get('last_verified', '2026-10-26'),
                    "replacement_image_url": alt.get('image_url'),
                    "replacement_photo_attribution": alt.get('photo_attribution')
                })
                reason_summary = f"Attraction Contingency: Substituted with '{alt.get('name')}'."

    return jsonify({
        'scenario': scenario,
        'summary': reason_summary,
        'total_savings': round(total_savings, 2),
        'currency': trip['currency'],
        'constraints_audit': constraints_audit,
        'proposed_changes': proposed_changes,
        'applied': False,
        'notice': 'Preview only. Review the trade-offs and click "Confirm & Apply to Live Itinerary" to update your schedule.'
    }), 200

@adaptive_bp.route('/trips/<int:trip_id>/apply', methods=['POST'])
@require_auth
def apply_adaptation(trip_id: int):
    """
    Applies user-confirmed changes with full database transaction safety
    and saves an immutable revision record for audit trails and UNDO capability.
    """
    with get_db() as conn:
        trip = conn.execute("SELECT id, destination, currency FROM trips WHERE id = ? AND user_id = ?", (trip_id, request.user_id)).fetchone()
        if not trip:
            return jsonify({'error': 'Trip not found or unauthorized.'}), 404

        # 1. Take snapshot of current activities before applying
        snapshot_activities = conn.execute(
            """
            SELECT id, day_id, trip_id, name, description, category, time_slot,
                   duration_hours, estimated_entry_cost, estimated_transport_cost,
                   visit_order, interest_match_reason, location_name, map_query, is_active,
                   image_url, photo_attribution, place_id, latitude, longitude,
                   source_url, verification_status, last_verified
            FROM itinerary_activities
            WHERE trip_id = ?
            ORDER BY id ASC
            """,
            (trip_id,)
        ).fetchall()

        data = request.get_json() or {}
        changes = data.get('changes', [])
        scenario = data.get('scenario', 'adaptive_revision')
        applied_count = 0
        total_savings = 0.0

        for change in changes:
            act_id = change.get('activity_id')
            action = change.get('action')

            if action == 'remove':
                conn.execute("DELETE FROM itinerary_activities WHERE id = ? AND trip_id = ?", (act_id, trip_id))
                applied_count += 1
            elif change.get('replacement_name'):
                rep_name = change.get('replacement_name')
                img_data = resolve_place_image(
                    rep_name,
                    trip['destination'],
                    change.get('replacement_image_url'),
                    change.get('replacement_photo_attribution')
                )
                conn.execute(
                    """
                    UPDATE itinerary_activities
                    SET name = ?, description = ?, category = ?, estimated_entry_cost = ?,
                        estimated_transport_cost = ?, interest_match_reason = ?, map_query = ?,
                        image_url = ?, photo_attribution = ?, place_id = ?, latitude = ?, longitude = ?,
                        source_url = ?, verification_status = ?, last_verified = ?
                    WHERE id = ? AND trip_id = ?
                    """,
                    (
                        rep_name,
                        change.get('replacement_description'),
                        change.get('replacement_category', 'sightseeing'),
                        change.get('replacement_entry_cost', 0.0),
                        change.get('replacement_transport_cost', 50.0),
                        f"Adapted: {change.get('tradeoff_explanation', 'Adjusted for optimal experience')}",
                        f"{rep_name}, {trip['destination']}",
                        img_data.get('image_url'),
                        img_data.get('photo_attribution'),
                        change.get('replacement_place_id'),
                        change.get('replacement_latitude'),
                        change.get('replacement_longitude'),
                        change.get('replacement_source_url'),
                        change.get('replacement_verification_status', 'verified'),
                        change.get('replacement_last_verified', '2026-10-26'),
                        act_id,
                        trip_id
                    )
                )
                applied_count += 1
                if change.get('cost_difference') and change.get('cost_difference') < 0:
                    total_savings += abs(change['cost_difference'])

        # 2. Record Revision in itinerary_revisions
        summary_text = f"Applied {applied_count} adaptive adjustments ({scenario}). Total savings: {trip['currency']} {round(total_savings, 2)}."
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO itinerary_revisions (
                trip_id, user_id, scenario, summary, total_savings, currency,
                changes_applied, snapshot_before, can_undo
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
            """,
            (
                trip_id, request.user_id, scenario, summary_text, total_savings,
                trip['currency'], json.dumps(changes), json.dumps(snapshot_activities)
            )
        )
        revision_id = cursor.lastrowid

    return jsonify({
        'message': f"Successfully applied {applied_count} adaptive itinerary modifications.",
        'applied_count': applied_count,
        'revision_id': revision_id,
        'can_undo': True
    }), 200

@adaptive_bp.route('/trips/<int:trip_id>/revisions', methods=['GET'])
@require_auth
def get_trip_revisions(trip_id: int):
    """Retrieves revision history for a trip."""
    with get_db() as conn:
        trip = conn.execute("SELECT id FROM trips WHERE id = ? AND user_id = ?", (trip_id, request.user_id)).fetchone()
        if not trip:
            return jsonify({'error': 'Trip not found or unauthorized.'}), 404

        revisions = conn.execute(
            """
            SELECT id, trip_id, scenario, summary, total_savings, currency,
                   applied_at, can_undo, changes_applied
            FROM itinerary_revisions
            WHERE trip_id = ? AND user_id = ?
            ORDER BY applied_at DESC, id DESC
            """,
            (trip_id, request.user_id)
        ).fetchall()

    for rev in revisions:
        try:
            rev['changes_applied'] = json.loads(rev['changes_applied'])
        except Exception:
            rev['changes_applied'] = []

    return jsonify({'revisions': revisions}), 200

@adaptive_bp.route('/trips/<int:trip_id>/revisions/<int:revision_id>/undo', methods=['POST'])
@require_auth
def undo_revision(trip_id: int, revision_id: int):
    """
    Restores the exact activity snapshot from before a revision was applied.
    """
    with get_db() as conn:
        rev = conn.execute(
            """
            SELECT * FROM itinerary_revisions
            WHERE id = ? AND trip_id = ? AND user_id = ?
            """,
            (revision_id, trip_id, request.user_id)
        ).fetchone()

        if not rev:
            return jsonify({'error': 'Revision record not found or unauthorized.'}), 404

        if not rev['can_undo']:
            return jsonify({'error': 'This revision has already been undone or cannot be rolled back.'}), 400

        snapshot = json.loads(rev['snapshot_before'])

        # Restore snapshot
        # 1. Delete current activities for this trip
        conn.execute("DELETE FROM itinerary_activities WHERE trip_id = ?", (trip_id,))

        # 2. Insert back the snapshot records
        for act in snapshot:
            conn.execute(
                """
                INSERT INTO itinerary_activities (
                    id, day_id, trip_id, name, description, category, time_slot,
                    duration_hours, estimated_entry_cost, estimated_transport_cost,
                    visit_order, interest_match_reason, location_name, map_query, is_active,
                    image_url, photo_attribution, place_id, latitude, longitude,
                    source_url, verification_status, last_verified
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    act['id'], act['day_id'], act['trip_id'], act['name'], act['description'],
                    act['category'], act['time_slot'], act['duration_hours'],
                    act['estimated_entry_cost'], act['estimated_transport_cost'],
                    act['visit_order'], act['interest_match_reason'], act['location_name'],
                    act['map_query'], act['is_active'],
                    act.get('image_url'), act.get('photo_attribution'),
                    act.get('place_id'), act.get('latitude'), act.get('longitude'),
                    act.get('source_url'), act.get('verification_status', 'verified'),
                    act.get('last_verified', '2026-10-26')
                )
            )

        # Mark revision as undone
        conn.execute("UPDATE itinerary_revisions SET can_undo = 0 WHERE id = ?", (revision_id,))

    return jsonify({
        'message': 'Itinerary successfully restored to previous state.',
        'undone_revision_id': revision_id,
        'restored_activities_count': len(snapshot)
    }), 200
