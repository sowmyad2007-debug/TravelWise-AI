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
        "category": "Receipt Management",
        "question": "How do I upload and track receipts for trip expenses?",
        "answer": "Go to the 'Receipts' section from the top navigation or sidebar. You can upload photos (JPG, PNG) or PDFs, or take a picture using your mobile camera. Our system extracts the merchant name, amount, and date, and allows one-click conversion into an expense record."
    },
    {
        "category": "Attraction Accuracy",
        "question": "How does TravelWise ensure destination photos are authentic?",
        "answer": "We maintain a verified catalog of 316+ attractions with genuine Wikimedia Commons photography. We never use decorative fairy lights or generic placeholders for specific destinations like Munnar tea estates, Goa forts, or Ooty lakes."
    },
    {
        "category": "Group Travel",
        "question": "How does the Group Expense Splitter settle unequal payments?",
        "answer": "It runs a Minimum Cash Flow algorithm that calculates each traveler's net balance and generates the absolute minimum number of peer-to-peer repayments, eliminating confusing multi-way debt circles."
    },
    {
        "category": "Safety & Emergencies",
        "question": "Are emergency helpline numbers verified?",
        "answer": "Yes, we list official government helplines (India 112/100, Tourist Helpline 1363, Women Helpline 1091, Railway Security 139, International 112/911/999). Always prioritize local emergency services when immediate medical or physical assistance is required."
    },
    {
        "category": "Data & Privacy",
        "question": "Who can see my saved trips and expenses?",
        "answer": "Only you. Every trip, receipt, and expense record is strictly isolated with server-side owner authorization checks. We do not sell or expose your personal travel plans."
    }
]

TOURISM_LINKS = [
    {"name": "Incredible India Official Portal", "url": "https://www.incredibleindia.org/", "region": "India National"},
    {"name": "Kerala Tourism (Munnar, Kochi, Alleppey)", "url": "https://www.keralatourism.org/", "region": "Kerala"},
    {"name": "Goa Tourism Development Corporation", "url": "https://goatourism.gov.in/", "region": "Goa"},
    {"name": "Tamil Nadu Tourism (Ooty, Nilgiris, Chennai)", "url": "https://www.tamilnadutourism.tn.gov.in/", "region": "Tamil Nadu"},
    {"name": "Telangana Tourism (Hyderabad, Charminar)", "url": "https://www.telanganatourism.gov.in/", "region": "Telangana"},
    {"name": "Andhra Pradesh Tourism (Vizag, Tirupati)", "url": "https://tourism.ap.gov.in/", "region": "Andhra Pradesh"},
    {"name": "Rajasthan Tourism (Jaipur, Amber Fort)", "url": "https://www.tourism.rajasthan.gov.in/", "region": "Rajasthan"},
    {"name": "Himachal Pradesh Tourism (Manali, Solang)", "url": "https://himachaltourism.gov.in/", "region": "Himachal Pradesh"},
    {"name": "France Official Tourism (Paris)", "url": "https://www.france.fr/en", "region": "International - France"},
    {"name": "Visit Britain (London, UK)", "url": "https://www.visitbritain.com/", "region": "International - UK"},
    {"name": "NYC Official Tourism (New York City)", "url": "https://www.nyctourism.com/", "region": "International - USA"},
    {"name": "Japan National Tourism (Tokyo, Kyoto)", "url": "https://www.japan.travel/en/", "region": "International - Japan"},
    {"name": "Australia Official Tourism (Sydney, Melbourne)", "url": "https://www.australia.com/", "region": "International - Australia"}
]

EMERGENCY_CONTACTS = [
    {"service": "National Emergency All-in-One", "phone": "112", "region": "India / European Union", "type": "Police, Fire, Medical"},
    {"service": "National Tourist Helpline (24x7, 12 Languages)", "phone": "1363", "region": "India National", "type": "Tourist Guidance & Safety"},
    {"service": "Police Assistance", "phone": "100", "region": "India", "type": "Police & Security"},
    {"service": "Medical Ambulance", "phone": "108 / 102", "region": "India", "type": "Medical Emergency"},
    {"service": "Women Safety Helpline", "phone": "1091", "region": "India", "type": "Women Safety"},
    {"service": "Indian Railway Helpline & Security", "phone": "139", "region": "India", "type": "Railway Transit"},
    {"service": "United States Emergency", "phone": "911", "region": "USA / Canada", "type": "Emergency Dispatch"},
    {"service": "United Kingdom Emergency", "phone": "999", "region": "UK", "type": "Emergency Dispatch"},
    {"service": "Australia Emergency", "phone": "000", "region": "Australia", "type": "Police, Fire, Ambulance"},
    {"service": "Japan Police Emergency", "phone": "110", "region": "Japan", "type": "Police Emergency"}
]

LANGUAGE_PHRASES = {
    "Malayalam (Munnar / Kerala)": [
        {"phrase": "Namaskaram", "meaning": "Hello / Greetings", "pronunciation": "Nuh-muh-skaa-rum"},
        {"phrase": "Ithinu ethra roopa?", "meaning": "How much does this cost?", "pronunciation": "Ih-thi-noo eh-thruh roo-pah"},
        {"phrase": "Nanni", "meaning": "Thank you", "pronunciation": "Nun-nee"},
        {"phrase": "Evideyaanu tea factory?", "meaning": "Where is the tea factory?", "pronunciation": "Eh-vi-day-aa-noo tea factory"},
        {"phrase": "Sahayikamo?", "meaning": "Can you please help me?", "pronunciation": "Suh-haa-yi-kkuh-mo"},
        {"phrase": "Vellam tharumo?", "meaning": "Can I have drinking water?", "pronunciation": "Vehl-lum thuh-roo-mo"}
    ],
    "Tamil (Ooty / Nilgiris / Chennai)": [
        {"phrase": "Vanakkam", "meaning": "Hello / Greetings", "pronunciation": "Vuh-nuh-kkum"},
        {"phrase": "Idhu evalavu?", "meaning": "How much does this cost?", "pronunciation": "Ih-dhu eh-vuh-luh-vu"},
        {"phrase": "Nandri", "meaning": "Thank you", "pronunciation": "Nun-dree"},
        {"phrase": "Kaaram kuraivaaga seiyavum", "meaning": "Please make it less spicy", "pronunciation": "Kaa-rum koo-ry-vaa-guh"},
        {"phrase": "Uthavi seiya mudiyuma?", "meaning": "Can you please help me?", "pronunciation": "Oo-thuh-vee seh-yuh moo-dee-yoo-maa"},
        {"phrase": "Thanni kidaikkuma?", "meaning": "Can I get drinking water?", "pronunciation": "Thun-nee kih-dy-koo-maa"}
    ],
    "Telugu (Hyderabad / Vizag / Tirupati)": [
        {"phrase": "Namaskaram", "meaning": "Hello / Greetings", "pronunciation": "Nuh-muh-skaa-rum"},
        {"phrase": "Idhi entha?", "meaning": "How much is this?", "pronunciation": "Ih-dhi ehn-thuh"},
        {"phrase": "Dhanyavaadalu", "meaning": "Thank you very much", "pronunciation": "Dhun-yuh-vaa-duh-loo"},
        {"phrase": "Rasta ekkada?", "meaning": "Where is the route / way?", "pronunciation": "Rus-thuh ehk-kuh-duh"},
        {"phrase": "Sahayam cheyagalaru?", "meaning": "Can you please help?", "pronunciation": "Suh-haa-yum cheh-yuh-guh-luh-roo"},
        {"phrase": "Kaaram thakkuva cheyandi", "meaning": "Please make it less spicy", "pronunciation": "Kaa-rum thuk-koo-vuh cheh-yun-dee"}
    ],
    "Hindi (Jaipur / Manali / North India)": [
        {"phrase": "Namaste", "meaning": "Hello / Greetings", "pronunciation": "Nuh-muh-steh"},
        {"phrase": "Yeh kitne ka hai?", "meaning": "How much is this?", "pronunciation": "Yeh kit-nay ka hai"},
        {"phrase": "Dhanyawaad / Shukriya", "meaning": "Thank you", "pronunciation": "Dhun-yuh-vaad"},
        {"phrase": "Kripya rasta bataiye", "meaning": "Please show the direction", "pronunciation": "Krip-yaa rus-taa buh-taa-ee-yay"},
        {"phrase": "Thoda kam keejiye", "meaning": "Please lower the price a little", "pronunciation": "Tho-daa kum kee-jee-yay"},
        {"phrase": "Peene ka paani milega?", "meaning": "Can I get drinking water?", "pronunciation": "Pee-nay kaa paa-nee mi-lay-gaa"}
    ],
    "Konkani (Goa)": [
        {"phrase": "Deu boro dis dium", "meaning": "Good day / Hello", "pronunciation": "Day-oo bo-ro dees dee-oom"},
        {"phrase": "Hache mol kitle?", "meaning": "How much does this cost?", "pronunciation": "Haa-chay mol kit-lay"},
        {"phrase": "Dev borem korum", "meaning": "Thank you (May God bless you)", "pronunciation": "Day-oo bo-rem ko-room"},
        {"phrase": "Maka vho rasto dakhoi", "meaning": "Please show me this route", "pronunciation": "Muh-kaa vho rus-to duh-khoy"}
    ],
    "French (Paris)": [
        {"phrase": "Bonjour", "meaning": "Hello / Good morning", "pronunciation": "Bon-zhoor"},
        {"phrase": "Combien ça coûte?", "meaning": "How much does this cost?", "pronunciation": "Kom-byen sah koot"},
        {"phrase": "Merci beaucoup", "meaning": "Thank you very much", "pronunciation": "Mair-see boh-koo"},
        {"phrase": "Parlez-vous anglais?", "meaning": "Do you speak English?", "pronunciation": "Par-lay voo zahn-glay"},
        {"phrase": "Où sont les toilettes?", "meaning": "Where is the restroom?", "pronunciation": "Oo sohn lay twah-let"}
    ],
    "Spanish (Spain / Latin America)": [
        {"phrase": "Hola", "meaning": "Hello", "pronunciation": "Oh-lah"},
        {"phrase": "¿Cuánto cuesta?", "meaning": "How much does this cost?", "pronunciation": "Kwan-toh kwes-tah"},
        {"phrase": "Muchas gracias", "meaning": "Thank you very much", "pronunciation": "Moo-chahs grah-see-ahs"},
        {"phrase": "¿Dónde está...?", "meaning": "Where is...?", "pronunciation": "Dohn-day ess-tah"}
    ],
    "Japanese (Tokyo / Kyoto)": [
        {"phrase": "Konnichiwa", "meaning": "Hello / Good afternoon", "pronunciation": "Kohn-nee-chee-wah"},
        {"phrase": "Ikura desu ka?", "meaning": "How much is this?", "pronunciation": "Ee-koo-rah dess kah"},
        {"phrase": "Arigatou gozaimasu", "meaning": "Thank you very much", "pronunciation": "Ah-ree-gah-toh go-zy-mass"},
        {"phrase": "Eigo ga hanasemasu ka?", "meaning": "Do you speak English?", "pronunciation": "Ay-go gah hah-nah-seh-mass kah"}
    ]
}

PACKING_CHECKLIST = [
    {
        "category": "Critical Documents",
        "items": [
            "Government-issued ID or Passport (with 6+ months validity)",
            "Confirmed train / flight e-tickets and boarding passes",
            "Hotel & homestay reservation vouchers",
            "Physical and digital copies of travel insurance",
            "Emergency contact list written on a physical card"
        ]
    },
    {
        "category": "Health & Safety",
        "items": [
            "Personal prescription medications with original doctor notes",
            "First-aid kit (bandages, antiseptic, pain relievers, motion sickness tablets)",
            "Mosquito repellent spray & anti-itch balm (vital for Kerala, Goa)",
            "Sunscreen lotion SPF 50+ & UV-blocking sunglasses",
            "Reusable insulated water bottle with water-purification tablets"
        ]
    },
    {
        "category": "Electronics & Power",
        "items": [
            "Universal power adapter and multi-port USB-C fast charger",
            "High-capacity power bank (10,000 - 20,000 mAh)",
            "Offline map data downloaded in Google Maps or Maps.me",
            "Camera memory cards & waterproof zip pouch"
        ]
    },
    {
        "category": "Clothing by Climate",
        "items": [
            "Munnar & Ooty: Lightweight fleece jacket, thermal socks, rain poncho",
            "Goa & Vizag: Breathable cotton/linen wear, swimwear, sandals",
            "Pilgrimage Shrines: Modest shoulder/knee covering attire & slip-on footwear",
            "Sturdy, broken-in walking shoes for heritage fort trails"
        ]
    }
]

@helper_bp.route('/resources', methods=['GET'])
def get_helper_resources():
    return jsonify({
        'faqs': FAQS,
        'tourism_links': TOURISM_LINKS,
        'emergency_contacts': EMERGENCY_CONTACTS,
        'language_phrases': LANGUAGE_PHRASES,
        'packing_checklist': PACKING_CHECKLIST
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
    return jsonify({'tickets': [dict(t) for t in tickets]}), 200
