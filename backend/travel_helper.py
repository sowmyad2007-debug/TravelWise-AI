from flask import Blueprint, request, jsonify
from auth import require_auth
from database import get_db

helper_bp = Blueprint('helper', __name__, url_prefix='/api/helper')

FAQS = [
    {
        "category": "Budget & Money",
        "question": "How does TravelWise AI+ calculate daily budget estimates?",
        "answer": "TravelWise divides your total budget across days while reserving realistic percentages for transport (25%), accommodation (35%), dining (22%), activities (12%), and a 6% buffer for emergencies and miscellaneous costs based on your selected travel style."
    },
    {
        "category": "Itinerary Changes",
        "question": "What happens if it rains or an outdoor attraction is closed?",
        "answer": "Use our 'Adaptive Travel Intelligence' panel or tell the AI Travel Buddy. It identifies outdoor activities and automatically proposes indoor cultural hubs, covered bazaars, or sheltered tea estates without disrupting your remaining days."
    },
    {
        "category": "Group Travel",
        "question": "How does the Group Expense Splitter settle unequal payments?",
        "answer": "It runs a Minimum Cash Flow algorithm that calculates each traveler's net balance and generates the absolute minimum number of peer-to-peer repayments, eliminating confusing multi-way debt circles."
    },
    {
        "category": "Safety & Emergencies",
        "question": "Are emergency helpline numbers verified?",
        "answer": "Yes, we list official government helplines (India 112/100, Tourist Helpline 1363, Women Helpline 1091, International 112/911). Always prioritize local emergency services when immediate medical or physical assistance is required."
    },
    {
        "category": "Data & Privacy",
        "question": "Who can see my saved trips and expenses?",
        "answer": "Only you. Every trip and expense record is strictly isolated with server-side owner authorization checks. We do not sell or expose your personal travel plans."
    }
]

TOURISM_LINKS = [
    {"name": "Incredible India Official Portal", "url": "https://www.incredibleindia.org/", "region": "India National"},
    {"name": "Tamil Nadu Tourism (Ooty, Nilgiris)", "url": "https://www.tamilnadutourism.tn.gov.in/", "region": "Tamil Nadu"},
    {"name": "Goa Tourism Development Corporation", "url": "https://goatourism.gov.in/", "region": "Goa"},
    {"name": "Rajasthan Tourism (Jaipur, Udaipur)", "url": "https://www.tourism.rajasthan.gov.in/", "region": "Rajasthan"},
    {"name": "Himachal Pradesh Tourism (Manali, Shimla)", "url": "https://himachaltourism.gov.in/", "region": "Himachal Pradesh"},
    {"name": "Kerala Tourism (God's Own Country)", "url": "https://www.keralatourism.org/", "region": "Kerala"},
    {"name": "France Official Tourism (Paris)", "url": "https://www.france.fr/en", "region": "International - France"},
    {"name": "Japan National Tourism Organization", "url": "https://www.japan.travel/en/", "region": "International - Japan"}
]

EMERGENCY_CONTACTS = [
    {"service": "National Emergency Number", "phone": "112", "region": "India / European Union", "type": "Police, Fire, Ambulance"},
    {"service": "Police Assistance", "phone": "100", "region": "India", "type": "Police"},
    {"service": "Tourist Helpline (Toll-Free, 12 Languages)", "phone": "1363", "region": "India National", "type": "Tourist Support"},
    {"service": "Medical Ambulance", "phone": "108 / 102", "region": "India", "type": "Medical Emergency"},
    {"service": "Women Safety Helpline", "phone": "1091", "region": "India", "type": "Safety"},
    {"service": "United States Emergency", "phone": "911", "region": "USA", "type": "Emergency"},
    {"service": "United Kingdom Emergency", "phone": "999", "region": "UK", "type": "Emergency"}
]

LANGUAGE_PHRASES = {
    "Tamil (Ooty / Nilgiris / Chennai)": [
        {"phrase": "Vanakkam", "meaning": "Hello / Greetings", "pronunciation": "Vuh-nuh-kkum"},
        {"phrase": "Idhu evalavu?", "meaning": "How much does this cost?", "pronunciation": "Ih-dhu eh-vuh-luh-vu"},
        {"phrase": "Nandri", "meaning": "Thank you", "pronunciation": "Nun-dree"},
        {"phrase": "Kaaram kuraivaaga seiyavum", "meaning": "Please make it less spicy", "pronunciation": "Kaa-rum koo-ry-vaa-guh"},
        {"phrase": "Uthavi seiya mudiyuma?", "meaning": "Can you please help me?", "pronunciation": "Oo-thuh-vee seh-yuh moo-dee-yoo-maa"}
    ],
    "Hindi (Jaipur / Manali / North India)": [
        {"phrase": "Namaste", "meaning": "Hello / Greetings", "pronunciation": "Nuh-muh-steh"},
        {"phrase": "Yeh kitne ka hai?", "meaning": "How much is this?", "pronunciation": "Yeh kit-nay ka hai"},
        {"phrase": "Dhanyawaad / Shukriya", "meaning": "Thank you", "pronunciation": "Dhun-yuh-vaad"},
        {"phrase": "Kripya rasta bataiye", "meaning": "Please show the direction", "pronunciation": "Krip-yaa rus-taa buh-taa-ee-yay"},
        {"phrase": "Thoda kam keejiye", "meaning": "Please lower the price a little", "pronunciation": "Tho-daa kum kee-jee-yay"}
    ],
    "Konkani (Goa)": [
        {"phrase": "Deu boro dis dium", "meaning": "Good day / Hello", "pronunciation": "Day-oo bo-ro dees dee-oom"},
        {"phrase": "Hache mol kitle?", "meaning": "How much does this cost?", "pronunciation": "Haa-chay mol kit-lay"},
        {"phrase": "Dev borem korum", "meaning": "Thank you (May God bless you)", "pronunciation": "Day-oo bo-rem ko-room"}
    ],
    "French (Paris)": [
        {"phrase": "Bonjour", "meaning": "Hello / Good morning", "pronunciation": "Bon-zhoor"},
        {"phrase": "Combien ça coûte?", "meaning": "How much does this cost?", "pronunciation": "Kom-byen sah koot"},
        {"phrase": "Merci beaucoup", "meaning": "Thank you very much", "pronunciation": "Mair-see boh-koo"},
        {"phrase": "Parlez-vous anglais?", "meaning": "Do you speak English?", "pronunciation": "Par-lay voo zahn-glay"}
    ]
}

@helper_bp.route('/resources', methods=['GET'])
def get_helper_resources():
    return jsonify({
        'faqs': FAQS,
        'tourism_links': TOURISM_LINKS,
        'emergency_contacts': EMERGENCY_CONTACTS,
        'language_phrases': LANGUAGE_PHRASES
    }), 200

@helper_bp.route('/support-tickets', methods=['POST'])
def submit_support_ticket():
    data = request.get_json() or {}
    name = (data.get('name') or '').strip()
    email = (data.get('email') or '').strip().lower()
    category = (data.get('category') or 'General Inquiry').strip()
    subject = (data.get('subject') or '').strip()
    message = (data.get('message') or '').strip()
    priority = (data.get('priority') or 'medium').strip()

    if not name or not email or not subject or not message:
        return jsonify({'error': 'Name, email, subject, and message description are required.'}), 400

    user_id = None
    # If authenticated, associate user_id
    auth_header = request.headers.get('Authorization', '')
    if auth_header and auth_header.startswith('Bearer '):
        import jwt
        from config import SECRET_KEY
        try:
            token = auth_header.split(' ', 1)[1].strip()
            payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            user_id = int(payload.get('sub')) if payload.get('sub') else None
        except Exception:
            pass

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO support_requests (user_id, name, email, category, subject, message, priority, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'submitted_demo_mode')
            """,
            (user_id, name, email, category, subject, message, priority)
        )
        ticket_id = cursor.lastrowid

    return jsonify({
        'message': 'Your support inquiry has been successfully recorded in the system.',
        'ticket_id': f"TW-SUP-{ticket_id:04d}",
        'demo_mode_notice': 'Notice: This application is operating in student/academic demo mode. Your support ticket is persisted in the local database for evaluation.'
    }), 201

@helper_bp.route('/my-tickets', methods=['GET'])
@require_auth
def get_user_tickets():
    with get_db() as conn:
        tickets = conn.execute(
            "SELECT * FROM support_requests WHERE user_id = ? ORDER BY created_at DESC",
            (request.user_id,)
        ).fetchall()
    return jsonify({'tickets': tickets}), 200
