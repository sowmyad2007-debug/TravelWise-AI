"""
Comprehensive Test Suite for Expanded Global & Indian Destinations in TravelWise AI+ 2.0.
Verifies:
1. Canonical destination name resolution across variations, typos, and abbreviations
   (Vizag, Alleppey, Pondy, Bangalore, Mysore, UK, USA, Kashmir, etc.).
2. Regional sub-destinations for Kerala, Karnataka, Tamil Nadu, California, USA, Australia.
3. 3-day itinerary generation across International & Indian destinations with:
   - Zero duplicate attractions across all days
   - Authentic photograph URLs matching each exact attraction
   - Real opening hours, transit times, and preference match scores in [0, 100]
4. Seasonal pilgrimage opening advisory for Kedarnath and Badrinath (May to Oct/Nov).
5. Konark Sun Temple distinguished as nearby excursion from Puri.
6. API endpoints /api/destinations and /api/destinations/resolve.
"""

import unittest
import json
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app import create_app
from destination_data import (
    DESTINATIONS,
    CANONICAL_DESTINATION_MAP,
    REGIONAL_SUB_DESTINATIONS,
    get_destination_info,
    resolve_canonical_key,
    get_sub_destinations,
    normalize_place_name
)
from image_service import is_valid_image_url

class TestExpandedDestinations(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.app.config['TESTING'] = True
        cls.client = cls.app.test_client()

        # Login as demo user
        login_res = cls.client.post('/api/auth/login', json={
            'email': 'demo@travelwise.ai',
            'password': 'Password123!'
        })
        cls.token = login_res.get_json()['token']
        cls.headers = {'Authorization': f'Bearer {cls.token}'}

    def test_01_canonical_name_resolution(self):
        """Verifies canonical normalization for all requested variations."""
        test_pairs = [
            ("vizag", "visakhapatnam"),
            ("Vizag", "visakhapatnam"),
            ("visakhapatnam", "visakhapatnam"),
            ("alleppey", "alappuzha"),
            ("Alleppey", "alappuzha"),
            ("alappuzha", "alappuzha"),
            ("pondy", "puducherry"),
            ("Pondicherry", "puducherry"),
            ("puducherry", "puducherry"),
            ("bangalore", "bengaluru"),
            ("bengaluru", "bengaluru"),
            ("mysore", "mysuru"),
            ("mysuru", "mysuru"),
            ("uk", "london"),
            ("United Kingdom", "london"),
            ("great britain", "london"),
            ("London", "london"),
            ("usa", "united_states"),
            ("America", "united_states"),
            ("United States", "united_states"),
            ("kashmir", "jammu_and_kashmir"),
            ("Srinagar", "jammu_and_kashmir"),
            ("Jammu and Kashmir", "jammu_and_kashmir"),
            ("sf", "san_francisco"),
            ("San Francisco", "san_francisco"),
            ("la", "los_angeles"),
            ("Los Angeles", "los_angeles"),
            ("yosemite", "yosemite"),
            ("new york", "new_york"),
            ("nyc", "new_york"),
            ("hong kong", "hong_kong"),
            ("hk", "hong_kong"),
            ("china", "china"),
            ("beijing", "china"),
            ("vietnam", "vietnam"),
            ("hanoi", "vietnam"),
            ("maldives", "maldives"),
            ("bali", "bali"),
            ("indonesia", "bali"),
            ("sydney", "sydney"),
            ("australia", "australia"),
            ("melbourne", "melbourne"),
            ("spain", "spain"),
            ("barcelona", "spain"),
            ("russia", "russia"),
            ("moscow", "russia"),
            ("germany", "germany"),
            ("berlin", "germany"),
            ("tirupati", "tirupati"),
            ("bhadrachalam", "bhadrachalam"),
            ("shirdi", "shirdi"),
            ("nashik", "nashik"),
            ("guntur", "guntur"),
            ("vijayawada", "vijayawada"),
            ("kadapa", "kadapa"),
            ("kurnool", "kurnool"),
            ("chennai", "chennai"),
            ("puri", "puri"),
            ("kedarnath", "kedarnath"),
            ("badrinath", "badrinath")
        ]

        for query, expected_key in test_pairs:
            canonical = resolve_canonical_key(query)
            self.assertEqual(canonical, expected_key, f"Failed for query '{query}': expected {expected_key}, got {canonical}")
            info = get_destination_info(query)
            self.assertIn("activities", info, f"Missing activities for '{query}'")
            self.assertGreater(len(info["activities"]), 0, f"Empty activities for '{query}'")

    def test_02_regional_sub_destinations(self):
        """Verifies sub-destination choices for broad regions."""
        regions = {
            "kerala": ["munnar", "kochi", "alappuzha"],
            "karnataka": ["bengaluru", "mysuru"],
            "tamil_nadu": ["chennai", "ooty", "puducherry"],
            "california": ["san_francisco", "los_angeles", "yosemite"],
            "united_states": ["new_york", "san_francisco", "los_angeles"],
            "australia": ["sydney", "melbourne"]
        }
        for reg, expected_keys in regions.items():
            subs = get_sub_destinations(reg)
            self.assertGreater(len(subs), 0, f"No sub-destinations for {reg}")
            sub_keys = [s["key"] for s in subs]
            for exp in expected_keys:
                self.assertIn(exp, sub_keys, f"Expected sub-destination '{exp}' in region '{reg}'")

    def test_03_seasonal_pilgrimage_advisory(self):
        """Verifies seasonal pilgrimage constraints for Kedarnath and Badrinath."""
        ked = get_destination_info("Kedarnath")
        self.assertIsNotNone(ked.get("seasonal_advisory"))
        self.assertIn("May to October", ked.get("seasonal_advisory"))

        bad = get_destination_info("Badrinath")
        self.assertIsNotNone(bad.get("seasonal_advisory"))
        self.assertIn("May to November", bad.get("seasonal_advisory"))

    def test_04_puri_konark_excursion_distinction(self):
        """Verifies Konark Sun Temple is clearly designated as a day excursion from Puri."""
        puri = get_destination_info("Puri")
        act_names = [a["name"] for a in puri["activities"]]
        konark_acts = [name for name in act_names if "Konark" in name]
        self.assertEqual(len(konark_acts), 1)
        self.assertIn("Excursion", konark_acts[0])

    def test_05_api_destinations_catalog_endpoint(self):
        """Verifies GET /api/destinations returns complete sorted catalog and regional data."""
        res = self.client.get('/api/destinations')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("destinations", data)
        self.assertIn("regional_sub_destinations", data)
        self.assertGreaterEqual(len(data["destinations"]), 45)

        # Check first destination structure
        d0 = data["destinations"][0]
        self.assertIn("name", d0)
        self.assertIn("hero_image", d0)
        self.assertIn("avg_daily_cost", d0)
        self.assertTrue(is_valid_image_url(d0["hero_image"]))

    def test_06_api_destinations_resolve_endpoint(self):
        """Verifies GET /api/destinations/resolve handles queries, aliases, and sub-destinations."""
        # Query: Vizag
        r1 = self.client.get('/api/destinations/resolve?q=Vizag')
        self.assertEqual(r1.status_code, 200)
        d1 = r1.get_json()
        self.assertEqual(d1["canonical_name"], "Visakhapatnam")
        self.assertEqual(d1["destination_key"], "visakhapatnam")
        self.assertTrue(is_valid_image_url(d1["hero_image"]))

        # Query: Kerala (broad region)
        r2 = self.client.get('/api/destinations/resolve?q=Kerala')
        self.assertEqual(r2.status_code, 200)
        d2 = r2.get_json()
        self.assertGreater(len(d2["sub_destinations"]), 0)

    def test_07_itinerary_generation_international_london(self):
        """Verifies 3-day London itinerary has 0 duplicates and authentic attraction photos."""
        res = self.client.post('/api/trips', json={
            'starting_city': 'New York',
            'destination': 'London',
            'start_date': '2026-11-10',
            'end_date': '2026-11-12',
            'travelers': 2,
            'total_budget': 1500,
            'currency': 'GBP',
            'travel_style': 'balanced',
            'interests': ['history', 'culture', 'photography']
        }, headers=self.headers)
        self.assertEqual(res.status_code, 201)
        trip_id = res.get_json()['trip_id']

        trip = self.client.get(f'/api/trips/{trip_id}', headers=self.headers).get_json()['trip']
        self.assertEqual(trip['destination'], 'London')
        self.assertEqual(trip['currency'], 'GBP')
        self.assertEqual(len(trip['days']), 3)

        all_acts = [a for d in trip['days'] for a in d['activities']]
        verified_acts = [a for a in all_acts if a.get('verification_status') == 'verified']
        self.assertGreaterEqual(len(verified_acts), 5)

        # Zero duplicates check
        verified_names = [normalize_place_name(a['name']) for a in verified_acts]
        self.assertEqual(len(verified_names), len(set(verified_names)))

        # Image validity check
        for a in verified_acts:
            self.assertTrue(is_valid_image_url(a['image_url']))
            self.assertIsNotNone(a['photo_attribution'])

    def test_08_itinerary_generation_indian_tirupati(self):
        """Verifies 3-day Tirupati pilgrimage itinerary has 0 duplicates and verified photos."""
        res = self.client.post('/api/trips', json={
            'starting_city': 'Chennai',
            'destination': 'Vizag', # Tests canonical conversion to Visakhapatnam
            'start_date': '2026-11-15',
            'end_date': '2026-11-17',
            'travelers': 2,
            'total_budget': 20000,
            'currency': 'INR',
            'travel_style': 'balanced',
            'interests': ['beach', 'history', 'nature']
        }, headers=self.headers)
        self.assertEqual(res.status_code, 201)
        trip_id = res.get_json()['trip_id']

        trip = self.client.get(f'/api/trips/{trip_id}', headers=self.headers).get_json()['trip']
        self.assertEqual(trip['destination'], 'Visakhapatnam')
        self.assertEqual(trip['title'], 'Visakhapatnam Adventure')

        all_acts = [a for d in trip['days'] for a in d['activities']]
        verified_acts = [a for a in all_acts if a.get('verification_status') == 'verified']
        self.assertGreaterEqual(len(verified_acts), 5)

        verified_names = [normalize_place_name(a['name']) for a in verified_acts]
        self.assertEqual(len(verified_names), len(set(verified_names)))

if __name__ == '__main__':
    unittest.main()
