"""
Expanded Destination Knowledge Base for TravelWise AI+ 2.0.
Contains verified International and Indian destinations with genuine Wikimedia Commons
photographs, exact coordinates, official tourism sources, and zero generic placeholders.
"""

import json
import os
from typing import Dict, List, Any, Optional

CANONICAL_DESTINATION_MAP: Dict[str, str] = {
    # Andhra Pradesh
    "vizag": "visakhapatnam",
    "visakhapatnam": "visakhapatnam",
    "waltair": "visakhapatnam",
    "tirupati": "tirupati",
    "tirumala": "tirupati",
    "bhadrachalam": "bhadrachalam",
    "guntur": "guntur",
    "amaravati": "guntur",
    "vijayawada": "vijayawada",
    "bezawada": "vijayawada",
    "kadapa": "kadapa",
    "cuddapah": "kadapa",
    "kurnool": "kurnool",
    
    # Kerala
    "alleppey": "alappuzha",
    "alappuzha": "alappuzha",
    "kochi": "kochi",
    "cochin": "kochi",
    "munnar": "munnar",
    "kerala": "kerala",
    
    # Tamil Nadu & Puducherry
    "chennai": "chennai",
    "madras": "chennai",
    "ooty": "ooty",
    "udagamandalam": "ooty",
    "puducherry": "puducherry",
    "pondicherry": "puducherry",
    "pondy": "puducherry",
    "tamil nadu": "tamil_nadu",
    "tamilnadu": "tamil_nadu",
    
    # Karnataka
    "bangalore": "bengaluru",
    "bengaluru": "bengaluru",
    "mysore": "mysuru",
    "mysuru": "mysuru",
    "karnataka": "karnataka",
    
    # Maharashtra
    "bombay": "mumbai",
    "mumbai": "mumbai",
    "shirdi": "shirdi",
    "nashik": "nashik",
    "nasik": "nashik",
    
    # North & Pilgrimage India
    "hyderabad": "hyderabad",
    "secunderabad": "hyderabad",
    "puri": "puri",
    "jagannath puri": "puri",
    "kedarnath": "kedarnath",
    "badrinath": "badrinath",
    "delhi": "delhi",
    "new delhi": "delhi",
    "agra": "agra",
    "jaipur": "jaipur",
    "manali": "manali",
    "kashmir": "jammu_and_kashmir",
    "srinagar": "jammu_and_kashmir",
    "jammu and kashmir": "jammu_and_kashmir",
    "jammu & kashmir": "jammu_and_kashmir",
    "j&k": "jammu_and_kashmir",
    "goa": "goa",
    
    # International Destinations
    "london": "london",
    "uk": "london",
    "united kingdom": "london",
    "great britain": "london",
    "britain": "london",
    "england": "london",
    
    "new york": "new_york",
    "new york city": "new_york",
    "nyc": "new_york",
    "ny": "new_york",
    
    "california": "california",
    "san francisco": "san_francisco",
    "sf": "san_francisco",
    "los angeles": "los_angeles",
    "la": "los_angeles",
    "yosemite": "yosemite",
    "usa": "united_states",
    "america": "united_states",
    "united states": "united_states",
    "united states of america": "united_states",
    
    "hong kong": "hong_kong",
    "hongkong": "hong_kong",
    "hk": "hong_kong",
    
    "china": "china",
    "beijing": "china",
    
    "vietnam": "vietnam",
    "hanoi": "vietnam",
    "ha long": "vietnam",
    "ha long bay": "vietnam",
    "hoi an": "vietnam",
    
    "maldives": "maldives",
    "male": "maldives",
    
    "bali": "bali",
    "indonesia": "bali",
    
    "sydney": "sydney",
    "melbourne": "melbourne",
    "australia": "australia",
    
    "spain": "spain",
    "barcelona": "spain",
    "madrid": "spain",
    
    "russia": "russia",
    "moscow": "russia",
    "st petersburg": "russia",
    "saint petersburg": "russia",
    
    "germany": "germany",
    "berlin": "germany",
    "munich": "germany",
    
    "paris": "paris",
    "france": "paris",
}

REGIONAL_SUB_DESTINATIONS: Dict[str, List[Dict[str, str]]] = {
    "kerala": [
        {"name": "Munnar", "key": "munnar", "description": "Tea highlands, misty mountain peaks & cascading waterfalls", "tag": "Hill Station"},
        {"name": "Kochi", "key": "kochi", "description": "Historic colonial port, Chinese fishing nets & art heritage", "tag": "Port & Culture"},
        {"name": "Alappuzha (Alleppey)", "key": "alappuzha", "description": "Tranquil backwaters, palm canals & overnight houseboat cruises", "tag": "Backwaters"}
    ],
    "karnataka": [
        {"name": "Bengaluru", "key": "bengaluru", "description": "Garden City, tech innovation, aerospace museums & breweries", "tag": "Metropolis"},
        {"name": "Mysuru", "key": "mysuru", "description": "Royal Mysore Palace, Chamundi Hill, silk & Brindavan Gardens", "tag": "Royal Heritage"}
    ],
    "tamil_nadu": [
        {"name": "Chennai", "key": "chennai", "description": "Marina Beach, Kapaleeshwarar Temple & colonial Fort St. George", "tag": "Coastal Heritage"},
        {"name": "Ooty", "key": "ooty", "description": "Queen of Nilgiri Hill Stations, UNESCO toy train & rose gardens", "tag": "Hill Station"},
        {"name": "Puducherry", "key": "puducherry", "description": "French Quarter villas, Promenade Beach & Auroville Matrimandir", "tag": "French Colonial"}
    ],
    "california": [
        {"name": "San Francisco", "key": "san_francisco", "description": "Golden Gate Bridge, Alcatraz Island & historic cable cars", "tag": "Pacific Coast"},
        {"name": "Los Angeles", "key": "los_angeles", "description": "Hollywood Sign, Santa Monica Pier & world-renowned Getty Center", "tag": "Entertainment"},
        {"name": "Yosemite", "key": "yosemite", "description": "Glacial valleys, El Capitan, Half Dome & giant sequoias", "tag": "National Park"}
    ],
    "united_states": [
        {"name": "New York City", "key": "new_york", "description": "Statue of Liberty, Central Park, Broadway & Empire State Building", "tag": "Iconic Megacity"},
        {"name": "San Francisco, CA", "key": "san_francisco", "description": "Golden Gate Bridge, Fisherman's Wharf & scenic Pacific views", "tag": "West Coast"},
        {"name": "Los Angeles, CA", "key": "los_angeles", "description": "Hollywood, Santa Monica coastline & cultural museums", "tag": "Southern California"},
        {"name": "Yosemite National Park", "key": "yosemite", "description": "Sierra Nevada wilderness, towering granite peaks & waterfalls", "tag": "Nature Wonder"}
    ],
    "australia": [
        {"name": "Sydney", "key": "sydney", "description": "Sydney Opera House, Harbour Bridge & Bondi Beach coastal walk", "tag": "Harbour City"},
        {"name": "Melbourne", "key": "melbourne", "description": "Cultural capital, arts laneways, coffee culture & Great Ocean Road", "tag": "Arts & Culture"}
    ]
}

def resolve_canonical_key(query: str) -> Optional[str]:
    """Resolves arbitrary user input string to canonical destination key."""
    if not query:
        return None
    raw = query.strip().lower()
    
    # 1. Exact alias match
    if raw in CANONICAL_DESTINATION_MAP:
        return CANONICAL_DESTINATION_MAP[raw]
        
    # 2. Normalized punctuation / token matching
    cleaned = raw.replace('-', ' ').replace(',', ' ').replace('(', ' ').replace(')', ' ')
    cleaned_tokens = [t for t in cleaned.split() if t]
    clean_phrase = " ".join(cleaned_tokens)
    
    if clean_phrase in CANONICAL_DESTINATION_MAP:
        return CANONICAL_DESTINATION_MAP[clean_phrase]
        
    for alias, target in CANONICAL_DESTINATION_MAP.items():
        if alias in clean_phrase or clean_phrase in alias:
            return target
            
    return None

def get_sub_destinations(region_key: str) -> List[Dict[str, str]]:
    """Returns sub-destination options if the key represents a broad region."""
    canonical = resolve_canonical_key(region_key) or region_key.strip().lower()
    return REGIONAL_SUB_DESTINATIONS.get(canonical, [])

_JSON_FILE = os.path.join(os.path.dirname(__file__), "expanded_destinations.json")
NEW_DESTINATIONS: Dict[str, Dict[str, Any]] = {}

if os.path.exists(_JSON_FILE):
    try:
        with open(_JSON_FILE, "r", encoding="utf-8") as _f:
            NEW_DESTINATIONS = json.load(_f)
    except Exception:
        NEW_DESTINATIONS = {}
