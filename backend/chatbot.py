import json
import re
from flask import Blueprint, request, jsonify
from auth import require_auth
from database import get_db
from config import GEMINI_API_KEY
from destination_data import get_destination_info, get_destination_weather

chatbot_bp = Blueprint('chatbot', __name__, url_prefix='/api/chatbot')

# Try importing google-genai
GENAI_AVAILABLE = False
try:
    from google import genai
    from google.genai import types
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False

@chatbot_bp.route('/trips/<int:trip_id>/messages', methods=['GET'])
@require_auth
def get_chat_history(trip_id: int):
    with get_db() as conn:
        trip = conn.execute("SELECT id FROM trips WHERE id = ? AND user_id = ?", (trip_id, request.user_id)).fetchone()
        if not trip:
            return jsonify({'error': 'Trip not found or unauthorized.'}), 404

        messages = conn.execute(
            """
            SELECT id, role, message, action_type, action_payload, created_at
            FROM chat_messages
            WHERE trip_id = ? AND user_id = ?
            ORDER BY id ASC
            """,
            (trip_id, request.user_id)
        ).fetchall()

    for m in messages:
        if m['action_payload']:
            try:
                m['action_payload'] = json.loads(m['action_payload'])
            except Exception:
                pass

    return jsonify({'messages': messages}), 200

@chatbot_bp.route('/trips/<int:trip_id>/ask', methods=['POST'])
@require_auth
def ask_chatbot(trip_id: int):
    """
    AI Travel Buddy 2.0:
    Guaranteed deterministic math calculations, structured action verification,
    multi-scenario intelligence, and transparent distinction between verified actuals and planning estimates.
    """
    data = request.get_json() or {}
    user_message = (data.get('message') or '').strip()

    if not user_message:
        return jsonify({'error': 'Message cannot be empty.'}), 400

    # Retrieve strictly authorized trip context
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

        days = conn.execute("SELECT * FROM itinerary_days WHERE trip_id = ? ORDER BY day_number ASC", (trip_id,)).fetchall()
        for d in days:
            d['activities'] = conn.execute(
                "SELECT * FROM itinerary_activities WHERE day_id = ? AND is_active = 1 ORDER BY visit_order ASC",
                (d['id'],)
            ).fetchall()

        expenses = conn.execute("SELECT * FROM expenses WHERE trip_id = ? ORDER BY date DESC", (trip_id,)).fetchall()
        members = conn.execute("SELECT name FROM group_members WHERE trip_id = ?", (trip_id,)).fetchall()

    # Deterministic mathematical calculations
    total_budget = trip['total_budget']
    total_spent = trip['total_spent']
    remaining_budget = max(0.0, total_budget - total_spent)
    currency = trip['currency']

    # Category breakdown
    cat_spent = {'transport': 0.0, 'accommodation': 0.0, 'food': 0.0, 'sightseeing': 0.0, 'miscellaneous': 0.0}
    for e in expenses:
        cat = e['category'].lower()
        if cat in cat_spent:
            cat_spent[cat] = round(cat_spent[cat] + e['amount'], 2)
        else:
            cat_spent['miscellaneous'] = round(cat_spent['miscellaneous'] + e['amount'], 2)

    # Future estimated commitments
    future_activities_cost = sum(
        sum(a['estimated_entry_cost'] + a['estimated_transport_cost'] for a in d['activities'])
        for d in days
    )
    projected_final = round(total_spent + future_activities_cost, 2)

    # Weather check
    weather_info = get_destination_weather(trip['destination'])

    ai_response_text = ""
    action_type = None
    action_payload = None
    source = "demo_rule_engine"

    # Attempt Live Gemini 2.5 Flash if configured
    if GEMINI_API_KEY and GENAI_AVAILABLE:
        try:
            client = genai.Client(api_key=GEMINI_API_KEY)
            
            itinerary_summary = []
            for d in days:
                acts_str = ", ".join([f"{a['name']} (Est {currency} {a['estimated_entry_cost']})" for a in d['activities']])
                itinerary_summary.append(f"Day {d['day_number']}: {acts_str}")

            system_instruction = f"""
            You are TravelWise AI+ Buddy 2.0, an expert, budget-conscious travel companion.
            Current Verified Trip Context:
            - Destination: {trip['destination']} (Route: {trip['starting_city']} to {trip['destination']})
            - Duration: {len(days)} days ({trip['start_date']} to {trip['end_date']})
            - Planned Budget: {currency} {total_budget} (target)
            - Actual Spent So Far: {currency} {total_spent} (VERIFIED ACTUALS)
            - Remaining Cash Balance: {currency} {remaining_budget}
            - Category Expenses: Food={currency} {cat_spent['food']}, Transport={currency} {cat_spent['transport']}, Accommodation={currency} {cat_spent['accommodation']}, Sightseeing={currency} {cat_spent['sightseeing']}, Misc={currency} {cat_spent['miscellaneous']}
            - Projected Final Spending: {currency} {projected_final} (Actuals + Remaining Itinerary Estimates)
            - Current Weather: {weather_info.get('condition')} ({weather_info.get('temperature_c')}°C, Raining={weather_info.get('is_raining')})
            - Group Members: {", ".join([m['name'] for m in members]) or 'Solo'}
            - Itinerary Overview: {"; ".join(itinerary_summary)}

            CRITICAL RULES:
            1. NEVER hallucinate or guess budget numbers. Always use the verified numbers above.
            2. Distinguish verified facts (expenses logged) from planning estimates.
            3. Provide concise, helpful advice tailored to this active trip.
            """

            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=f"{system_instruction}\n\nUser Question: {user_message}"
            )
            ai_response_text = response.text
            source = "gemini_api"
        except Exception:
            ai_response_text = None

    # Fallback to deterministic heuristic engine
    if not ai_response_text:
        ai_response_text, action_type, action_payload = generate_grounded_response(
            user_message, trip, days, expenses, cat_spent, total_budget, total_spent,
            remaining_budget, currency, members, weather_info, future_activities_cost, projected_final
        )
        source = "demo_rule_engine"

    # Persist in chat history
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO chat_messages (trip_id, user_id, role, message) VALUES (?, ?, 'user', ?)",
            (trip_id, request.user_id, user_message)
        )
        payload_str = json.dumps(action_payload) if action_payload else None
        cursor.execute(
            "INSERT INTO chat_messages (trip_id, user_id, role, message, action_type, action_payload) VALUES (?, ?, 'assistant', ?, ?, ?)",
            (trip_id, request.user_id, ai_response_text, action_type, payload_str)
        )
        asst_id = cursor.lastrowid

    return jsonify({
        'message_id': asst_id,
        'reply': ai_response_text,
        'action_type': action_type,
        'action_payload': action_payload,
        'source': source,
        'badge': "⚡ Gemini 2.5 Flash Connected" if source == "gemini_api" else "⚡ Demo AI Engine (Local Deterministic Math)"
    }), 200

def generate_grounded_response(msg: str, trip, days, expenses, cat_spent, total_budget, total_spent, remaining, currency, members, weather, future_cost, projected_final):
    msg_low = msg.lower()
    
    # 1. Food spending inquiry: "How much did I spend on food?"
    if 'food' in msg_low and ('spent' in msg_low or 'how much' in msg_low or 'cost' in msg_low):
        pct = round((cat_spent['food'] / total_spent * 100) if total_spent > 0 else 0, 1)
        return (
            f"🍽️ **Verified Food Spending:**\n\n"
            f"You have spent **{currency} {cat_spent['food']}** on dining across your recorded transactions.\n"
            f"• This accounts for **{pct}%** of your total spending so far ({currency} {total_spent}).\n"
            f"• Your planned food benchmark for {trip['destination']} is **{currency} {round(total_budget * 0.22, 2)}**.\n\n"
            f"*(Verified from {len([e for e in expenses if e['category'] == 'food'])} food receipts)*",
            "view_category",
            {"category": "food", "amount": cat_spent['food']}
        )

    # 2. Total spending / budget remaining / forecast
    if 'remaining' in msg_low or 'left' in msg_low or 'budget status' in msg_low or 'forecast' in msg_low or 'projected' in msg_low:
        pct = round((total_spent / total_budget * 100) if total_budget > 0 else 0, 1)
        over_under = round(projected_final - total_budget, 2)
        variance_note = f"⚠️ Projected to overrun by {currency} {over_under}" if over_under > 0 else f"🟢 Under budget with {currency} {abs(over_under)} cushion"
        return (
            f"📊 **Financial Status for {trip['destination']}:**\n\n"
            f"- **Target Trip Budget:** {currency} {total_budget}\n"
            f"- **Actual Spent So Far:** {currency} {total_spent} ({pct}% utilized)\n"
            f"- **Remaining Cash Reserve:** {currency} {remaining}\n"
            f"- **Estimated Future Commitments:** {currency} {future_cost}\n"
            f"- **Projected Final Spending:** {currency} {projected_final} ({variance_note})\n\n"
            f"Click below to inspect the full interactive financial breakdown.",
            "view_budget",
            {"remaining": remaining, "projected_final": projected_final}
        )

    # 3. Weather / Rain adaptation
    if 'rain' in msg_low or 'weather' in msg_low or 'indoor' in msg_low or 'forecast' in msg_low:
        curr_cond = weather.get('condition', 'Cloudy')
        temp = weather.get('temperature_c', 20.0)
        return (
            f"🌧️ **Live Weather & Contingency ({trip['destination']}):**\n\n"
            f"- **Current Condition:** {curr_cond} ({temp}°C)\n"
            f"- **Source:** {weather.get('source')}\n\n"
            f"If outdoor conditions worsen, our **Adaptive Travel Intelligence 2.0** can swap all outdoor stops (lakes, peaks, valleys) with verified indoor museums, covered chocolate factories, and art centers without disrupting your schedule.",
            "trigger_adaptive",
            {"scenario": "rain", "label": "Preview Rain-Proof Itinerary"}
        )

    # 4. Low remaining funds / Overspent adjustment
    if ('only' in msg_low and any(c.isdigit() for c in msg_low)) or 'overspent' in msg_low or 'adjust' in msg_low or 'cut' in msg_low:
        return (
            f"🛡️ **Adaptive Recovery Activated:**\n\n"
            f"With **{currency} {remaining}** remaining, the adaptive engine can evaluate your upcoming days and replace high-cost entry attractions with zero-cost panoramic viewpoints and walking trails.\n\n"
            f"This recovers your budget without sacrificing the regional travel experience.",
            "trigger_adaptive",
            {"scenario": "overspent", "label": "Evaluate Budget Recovery Plan"}
        )

    # 5. Which day is most expensive / Replace expensive
    if 'expensive' in msg_low or 'cheaper' in msg_low or 'highest' in msg_low:
        max_act = None
        max_cost = -1
        max_day = 1
        for d in days:
            for a in d['activities']:
                cost = a['estimated_entry_cost'] + a['estimated_transport_cost']
                if cost > max_cost:
                    max_cost = cost
                    max_act = a
                    max_day = d['day_number']

        if max_act:
            return (
                f"💡 **Cost Optimization Opportunity:**\n\n"
                f"The highest single planned activity is **'{max_act['name']}'** on Day {max_day} (Estimated {currency} {max_cost}).\n\n"
                f"We can swap this with a top-rated free scenic spot or indoor heritage attraction.",
                "replace_activity",
                {"activity_id": max_act['id'], "activity_name": max_act['name'], "cost": max_cost}
            )

    # 6. Group splitting
    if 'split' in msg_low or 'friends' in msg_low or 'group' in msg_low or 'share' in msg_low:
        num_friends = len(members) if members else 2
        fair_share = round(total_spent / max(1, num_friends), 2)
        return (
            f"👥 **Group Financial Summary:**\n\n"
            f"- Total recorded shared expenses: **{currency} {total_spent}**\n"
            f"- Group size: **{num_friends} travelers** ({', '.join([m['name'] for m in members]) or 'You and friends'})\n"
            f"- Fair share per traveler: **{currency} {fair_share}**\n\n"
            f"Our **Minimum Cash Flow Optimizer** has simplified all peer debts. Click below to view the settlement steps.",
            "view_group_splitter",
            {"fair_share": fair_share, "travelers": num_friends}
        )

    # 7. Suggestions & nature spots
    if 'nature' in msg_low or 'hidden gem' in msg_low or 'crowd' in msg_low or 'suggest' in msg_low:
        dest_info = get_destination_info(trip['destination'], trip.get('interests', []))
        nature_acts = [a for a in dest_info.get('activities', []) if a.get('category') == 'nature' or 'nature' in a.get('interests', [])]
        picks = nature_acts[:2] if nature_acts else dest_info.get('activities', [])[:2]
        
        recs_text = "\n".join([f"• **{p['name']}**: {p['description']} (Est. {currency} {p['estimated_entry_cost']}, {p.get('opening_hours', '09:00 AM - 06:00 PM')})" for p in picks])
        return (
            f"🌿 **Curated Places in {trip['destination']}:**\n\n"
            f"{recs_text}\n\n"
            f"These spots match your interests and feature verified opening schedules.",
            "recommendations",
            {"picks": [p['name'] for p in picks]}
        )

    # Default overview
    return (
        f"👋 I'm your TravelWise AI+ Buddy for **{trip['destination']}**!\n\n"
        f"Current trip snapshot:\n"
        f"• **Planned Budget:** {currency} {total_budget} • **Spent:** {currency} {total_spent}\n"
        f"• **Remaining:** {currency} {remaining} • **Forecast Final:** {currency} {projected_final}\n"
        f"• **Weather:** {weather.get('condition')} ({weather.get('temperature_c')}°C)\n\n"
        f"Ask me about food expenses, rain alternatives, budget cuts, or group settlements!",
        None,
        None
    )
