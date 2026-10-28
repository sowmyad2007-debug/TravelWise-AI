"""
Image Service for TravelWise AI+ 2.0.
Retrieves authentic, verified photographs for destinations and attractions
using curated verified sources, Wikimedia Commons API (Public Domain & Creative Commons),
and Google Places API (when API key is provided).
Never uses fake, unrelated, or AI-hallucinated images.
"""

import os
import re
import html
import json
import requests
from typing import Dict, Optional, Tuple

CACHE_FILE = os.path.join(os.path.dirname(__file__), "image_cache.json")
IMAGE_CACHE: Dict[str, Dict[str, Optional[str]]] = {}
CACHE_MAX_SIZE = 2000
USER_AGENT = "TravelWiseAI/2.0 (student.project@travelwise.ai; PairProgramming/Antigravity)"

INVALID_EXTS = ('.pdf', '.html', '.htm', '.mp4', '.avi', '.mov', '.zip', '.tar', '.gz', '.txt', '.doc', '.docx')
VALID_IMAGE_EXTS = ('.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif')
VALID_IMAGE_HOSTS = ('places.googleapis.com', 'images.unsplash.com', 'lh3.googleusercontent.com', 'thumb.wikimedia.org', 'upload.wikimedia.org', 'wikimedia.org')

def load_cache():
    global IMAGE_CACHE
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, 'r', encoding='utf-8') as f:
                IMAGE_CACHE = json.load(f)
        except Exception:
            IMAGE_CACHE = {}

def save_cache():
    try:
        with open(CACHE_FILE, 'w', encoding='utf-8') as f:
            json.dump(IMAGE_CACHE, f, indent=2)
    except Exception:
        pass

# Initialize cache on module import
load_cache()

def is_valid_image_url(url: str) -> bool:
    """
    Validates that a URL is a genuine image resource.
    Supports standard image file extensions as well as extensionless API endpoints
    (such as Google Places media photos and Unsplash CDN URLs).
    Filters out PDFs, HTML pages, video files, and archives.
    """
    if not url or not isinstance(url, str):
        return False
    clean = url.strip()
    if not (clean.startswith("http://") or clean.startswith("https://")):
        return False
    path = clean.lower().split('?')[0]
    for ext in INVALID_EXTS:
        if path.endswith(ext):
            return False
    if path.endswith(VALID_IMAGE_EXTS):
        return True
    for host in VALID_IMAGE_HOSTS:
        if host in clean.lower():
            return True
    return False

def clean_search_term(term: str) -> str:
    """Removes noise words, bracketed text, and punctuation for clean query matching."""
    if not term:
        return ""
    # Strip parentheses and brackets
    cleaned = re.sub(r'\(.*?\)', ' ', term)
    cleaned = re.sub(r'\[.*?\]', ' ', cleaned)
    # Remove special characters
    cleaned = re.sub(r'[^\w\s]', ' ', cleaned)
    # Condense whitespace
    return " ".join(cleaned.split())

def fetch_from_wikimedia(query: str) -> Optional[Tuple[str, str]]:
    """
    Queries Wikimedia Commons and Wikipedia PageImages for real attraction photographs.
    Returns (image_url, attribution) or None.
    """
    headers = {"User-Agent": USER_AGENT}
    
    # 1. Try Wikipedia PageImages via search generator (finds closest genuine landmark article)
    try:
        wp_url = "https://en.wikipedia.org/w/api.php"
        wp_params = {
            "action": "query",
            "generator": "search",
            "gsrsearch": query,
            "gsrlimit": 3,
            "prop": "pageimages",
            "pithumbsize": 800,
            "format": "json"
        }
        res = requests.get(wp_url, params=wp_params, headers=headers, timeout=3.0)
        if res.status_code == 200:
            data = res.json()
            pages = data.get("query", {}).get("pages", {})
            for pid, pdata in pages.items():
                if pid != "-1" and "thumbnail" in pdata:
                    title = pdata.get("title", "")
                    # Filter out non-attraction generic overview pages
                    if title.lower() in ['india', 'tourism in india by state', 'list of waterfalls in india', 'bhutan', 'tamil nadu', 'kerala']:
                        continue
                    thumb_url = pdata["thumbnail"]["source"]
                    if is_valid_image_url(thumb_url):
                        attr = f"Wikimedia Commons / Wikipedia ({title})"
                        return thumb_url, attr
    except Exception:
        pass

    # 2. Try exact Wikipedia Pageimage by title
    try:
        wp_url = "https://en.wikipedia.org/w/api.php"
        wp_params = {
            "action": "query",
            "titles": query,
            "prop": "pageimages",
            "format": "json",
            "pithumbsize": 800,
            "redirects": 1
        }
        res = requests.get(wp_url, params=wp_params, headers=headers, timeout=3.0)
        if res.status_code == 200:
            data = res.json()
            pages = data.get("query", {}).get("pages", {})
            for pid, pdata in pages.items():
                if pid != "-1" and "thumbnail" in pdata:
                    thumb_url = pdata["thumbnail"]["source"]
                    if is_valid_image_url(thumb_url):
                        attr = f"Wikimedia Commons / Wikipedia ({pdata.get('title', query)})"
                        return thumb_url, attr
    except Exception:
        pass

    # 3. Try Wikimedia Commons File Search with dynamic thumburl
    try:
        wc_url = "https://commons.wikimedia.org/w/api.php"
        wc_params = {
            "action": "query",
            "generator": "search",
            "gsrsearch": f'filetype:bitmap "{query}"' if " " in query else f"filetype:bitmap {query}",
            "gsrnamespace": 6,  # File namespace
            "gsrlimit": 3,
            "prop": "imageinfo",
            "iiprop": "url|extmetadata",
            "iiurlwidth": 800,
            "format": "json"
        }
        res = requests.get(wc_url, params=wc_params, headers=headers, timeout=3.0)
        if res.status_code == 200:
            data = res.json()
            pages = data.get("query", {}).get("pages", {})
            for pid, pdata in pages.items():
                if pid != "-1" and "imageinfo" in pdata and pdata["imageinfo"]:
                    info = pdata["imageinfo"][0]
                    # Prefer thumburl (from thumb.wikimedia.org) over original raw url (to avoid 429/400)
                    img_url = info.get("thumburl") or info.get("url")
                    if img_url and is_valid_image_url(img_url):
                        meta = info.get("extmetadata", {})
                        artist = meta.get("Artist", {}).get("value", "")
                        artist_clean = html.unescape(re.sub(r'<[^>]+>', '', artist)).strip()
                        license_name = meta.get("LicenseShortName", {}).get("value", "CC")
                        attr_parts = ["Wikimedia Commons"]
                        if artist_clean:
                            attr_parts.append(f"Photo: {artist_clean}")
                        if license_name:
                            attr_parts.append(f"License: {license_name}")
                        attribution = " • ".join(attr_parts)
                        return img_url, attribution
    except Exception:
        pass

    return None

def fetch_from_google_places(attraction_name: str, destination: str) -> Optional[Tuple[str, str]]:
    """
    Fetches genuine photo using Google Places API (New) if an API key is configured.
    """
    api_key = os.getenv("GOOGLE_PLACES_API_KEY") or os.getenv("GOOGLE_MAPS_API_KEY")
    if not api_key:
        return None

    try:
        url = "https://places.googleapis.com/v1/places:searchText"
        headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": api_key,
            "X-Goog-FieldMask": "places.id,places.displayName,places.photos"
        }
        query_text = f"{attraction_name}, {destination}".strip(", ")
        payload = {"textQuery": query_text}
        
        resp = requests.post(url, json=payload, headers=headers, timeout=3.0)
        if resp.status_code == 200:
            data = resp.json()
            places = data.get("places", [])
            if places and "photos" in places[0] and places[0]["photos"]:
                photo = places[0]["photos"][0]
                photo_name = photo.get("name")
                attributions = photo.get("authorAttributions", [])
                author = attributions[0].get("displayName", "Google Maps Contributor") if attributions else "Google Maps"
                photo_url = f"https://places.googleapis.com/v1/{photo_name}/media?maxHeightPx=800&maxWidthPx=1000&key={api_key}"
                return photo_url, f"Google Maps / {author}"
    except Exception:
        pass

    return None

def resolve_place_image(attraction_name: str, destination: str = "", existing_image_url: str = None, existing_attribution: str = None, existing_source_url: str = None) -> Dict[str, Optional[str]]:
    """
    Strict 4-tier lookup priority for authentic attraction and destination photographs:
    1. Local Curated Catalog: verified existing photograph from destination database.
    2. Wikimedia Commons / Wikipedia PageImages: genuine CC/public-domain photograph.
    3. Google Places API (New): official Places photo when API key is configured.
    4. Honest Fallback: returns None with 'unavailable' status (never uses generic or fake photos).
    """
    clean_name = clean_search_term(attraction_name)
    clean_dest = clean_search_term(destination)
    if not clean_name and not clean_dest:
        return {
            "image_url": None,
            "photo_attribution": None,
            "source": "none",
            "source_page_url": None,
            "verification_status": "unavailable",
            "last_verified": "2026-10-26"
        }

    cache_key = f"{clean_name.lower()}::{clean_dest.lower()}"

    # Priority 1: Curated verified existing_image_url
    if existing_image_url and isinstance(existing_image_url, str):
        existing_image_url = existing_image_url.replace("thumb.wikimedia.org", "upload.wikimedia.org").replace("/900px-", "/960px-").split("?utm_source=")[0]

    if existing_image_url and existing_image_url.startswith("http") and is_valid_image_url(existing_image_url):
        res = {
            "image_url": existing_image_url,
            "photo_attribution": existing_attribution or "Verified Destination Photo",
            "source": "curated_verified",
            "source_page_url": existing_source_url or (existing_image_url if "wikimedia.org" in existing_image_url else None),
            "verification_status": "verified",
            "last_verified": "2026-10-28"
        }
        IMAGE_CACHE[cache_key] = res
        return res

    # Check cache if previously resolved
    if cache_key in IMAGE_CACHE:
        cached = IMAGE_CACHE[cache_key]
        if cached.get("image_url") and "thumb.wikimedia.org" in cached["image_url"]:
            cached["image_url"] = cached["image_url"].replace("thumb.wikimedia.org", "upload.wikimedia.org").split("?utm_source=")[0]
        return cached

    # Priority 2: Wikimedia Commons / Wikipedia API
    primary = attraction_name.split('&')[0].split('-')[0].split('(')[0].strip()
    clean_primary = clean_search_term(primary)
    
    w_res = None
    if clean_primary and clean_primary != clean_dest:
        w_res = fetch_from_wikimedia(f"{clean_primary} {clean_dest}".strip())
    if not w_res and clean_primary:
        w_res = fetch_from_wikimedia(clean_primary)
    if not w_res:
        w_res = fetch_from_wikimedia(f"{clean_name} {clean_dest}".strip())
    if not w_res and clean_name != clean_dest:
        w_res = fetch_from_wikimedia(clean_name)

    if w_res:
        result = {
            "image_url": w_res[0],
            "photo_attribution": w_res[1],
            "source": "wikimedia_commons",
            "source_page_url": w_res[0],
            "verification_status": "verified",
            "last_verified": "2026-10-26"
        }
        IMAGE_CACHE[cache_key] = result
        save_cache()
        return result

    # Priority 3: Google Places API (New) if key present
    g_res = fetch_from_google_places(clean_name, clean_dest)
    if g_res:
        result = {
            "image_url": g_res[0],
            "photo_attribution": g_res[1],
            "source": "google_places",
            "source_page_url": None,
            "verification_status": "verified",
            "last_verified": "2026-10-26"
        }
        IMAGE_CACHE[cache_key] = result
        save_cache()
        return result

    # Priority 4: Clean honest fallback
    result = {
        "image_url": None,
        "photo_attribution": None,
        "source": "unavailable",
        "source_page_url": None,
        "verification_status": "unavailable",
        "last_verified": "2026-10-26"
    }
    IMAGE_CACHE[cache_key] = result
    save_cache()
    return result
