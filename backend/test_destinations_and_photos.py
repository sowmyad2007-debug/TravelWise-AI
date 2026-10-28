"""
Comprehensive Test Suite for Destination Images & Deduplication in TravelWise AI+ 2.0.
Verifies:
1. 3-day Hyderabad itinerary generation with verified attractions (Charminar, Golconda Fort, Salar Jung Museum, Chowmahalla Palace),
   genuine images, valid opening hours, match score between 0% and 100%, and 0 duplicate places.
2. 2-day Ooty itinerary generation with Government Botanical Garden, Ooty Lake, Doddabetta Peak, and 0 duplicates.
3. 3-day Goa itinerary generation with Fort Aguada, Basilica of Bom Jesus, Anjuna Beach, and 0 duplicates.
4. 3-day Munnar itinerary generation with matching attraction photos.
5. Itinerary regeneration on trip updates without duplicates.
6. Graceful "Verified photo unavailable" fallback when images are absent.
7. Replacement activity deduplication and preservation of place_id / verification_status.
8. Adaptive intelligence adjustments and undo rollback preserving verification fields.
"""

import unittest
import json
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app import create_app
from database import get_db
from destination_data import normalize_place_name, are_places_duplicate, get_destination_info
from image_service import resolve_place_image

class TestDestinationsAndPhotos(unittest.TestCase):
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

    def test_01_name_normalization_and_duplicate_detection(self):
        """Verifies robust normalization and duplicate detection across phrasing variants."""
        # Exact match variants
        self.assertTrue(are_places_duplicate("Fort Aguada & Lighthouse", "Fort Aguada"))
        self.assertTrue(are_places_duplicate("Fort Aguada", "Fort Aguada & Lighthouse"))
        self.assertTrue(are_places_duplicate("Old Goa UNESCO Churches (Basilica of Bom Jesus)", "Basilica of Bom Jesus"))
        self.assertTrue(are_places_duplicate("Doddabetta Peak & Telescope House", "Doddabetta Peak"))
        self.assertTrue(are_places_duplicate("Eravikulam National Park (Rajamalai)", "Eravikulam National Park"))
        self.assertTrue(are_places_duplicate("Charminar Monument & Mosque", "Charminar"))
        self.assertTrue(are_places_duplicate("Golconda Fort & Acoustic Pavilions", "Golconda Fort"))

        # Distinct places must NOT be marked as duplicates
        self.assertFalse(are_places_duplicate("Fort Aguada", "Anjuna Beach"))
        self.assertFalse(are_places_duplicate("Attukad Waterfalls", "Mattupetty Dam"))
        self.assertFalse(are_places_duplicate("Ooty Botanical Gardens", "Ooty Lake & Boathouse"))
        self.assertFalse(are_places_duplicate("Charminar Monument & Mosque", "Golconda Fort"))

    def test_02_hyderabad_3day_itinerary_and_verified_attractions(self):
        """Generates a 3-day Hyderabad trip; verifies genuine photos, Charminar/Golconda/Salar Jung/Chowmahalla, and 0 duplicates."""
        payload = {
            "title": "Hyderabad Heritage Tour",
            "starting_city": "Bengaluru",
            "destination": "Hyderabad",
            "start_date": "2026-11-15",
            "end_date": "2026-11-17",
            "travelers": 2,
            "total_budget": 15000,
            "currency": "INR",
            "travel_style": "balanced",
            "interests": ["history", "culture", "food"]
        }
        res = self.client.post('/api/trips', json=payload, headers=self.headers)
        self.assertEqual(res.status_code, 201)
        trip_id = res.get_json()['trip_id']

        details_res = self.client.get(f'/api/trips/{trip_id}', headers=self.headers)
        self.assertEqual(details_res.status_code, 200)
        trip_data = details_res.get_json()['trip']

        # Verify cover image is authentic Charminar image
        self.assertIsNotNone(trip_data.get('cover_image'))
        self.assertIn('Charminar', trip_data.get('cover_image', ''))

        days = trip_data.get('days', [])
        self.assertEqual(len(days), 3)

        all_activity_names = []
        for d in days:
            day_acts = d.get('activities', [])
            self.assertEqual(len(day_acts), 3)
            for act in day_acts:
                all_activity_names.append(act['name'])
                # Verification attributes
                self.assertEqual(act.get('verification_status'), 'verified')
                self.assertIsNotNone(act.get('place_id'))
                self.assertIsNotNone(act.get('image_url'))
                self.assertTrue(act['image_url'].startswith('http'))
                # Match score must be between 0 and 100
                score = act.get('match_score')
                self.assertIsNotNone(score)
                self.assertGreaterEqual(score, 0)
                self.assertLessEqual(score, 100)
                # Opening hours must not be generic
                self.assertIsNotNone(act.get('opening_hours'))
                self.assertIn("AM", act.get('opening_hours', ''))

        # Check key verified landmarks are present
        names_str = " ".join(all_activity_names)
        self.assertIn("Charminar", names_str)
        self.assertIn("Golconda", names_str)
        self.assertIn("Salar Jung", names_str)
        self.assertIn("Chowmahalla", names_str)

        # 0 duplicates across all 3 days
        norm_names = [normalize_place_name(n) for n in all_activity_names]
        self.assertEqual(len(norm_names), len(set(norm_names)), f"Duplicates found: {all_activity_names}")

    def test_03_ooty_2day_itinerary(self):
        """Generates a 2-day Ooty trip; verifies Government Botanical Garden, Ooty Lake, Doddabetta Peak with 0 duplicates."""
        payload = {
            "title": "Ooty Nilgiri Weekend",
            "starting_city": "Coimbatore",
            "destination": "Ooty",
            "start_date": "2026-11-20",
            "end_date": "2026-11-21",
            "travelers": 2,
            "total_budget": 8000,
            "currency": "INR",
            "travel_style": "balanced",
            "interests": ["nature", "relaxation"]
        }
        res = self.client.post('/api/trips', json=payload, headers=self.headers)
        self.assertEqual(res.status_code, 201)
        trip_id = res.get_json()['trip_id']

        trip_data = self.client.get(f'/api/trips/{trip_id}', headers=self.headers).get_json()['trip']
        all_acts = [a['name'] for d in trip_data['days'] for a in d['activities']]

        names_str = " ".join(all_acts)
        self.assertTrue("Botanical Garden" in names_str or "Rose Garden" in names_str)
        self.assertIn("Ooty Lake", names_str)
        self.assertIn("Doddabetta", names_str)

        norm_names = [normalize_place_name(n) for n in all_acts]
        self.assertEqual(len(norm_names), len(set(norm_names)))

    def test_04_goa_3day_itinerary(self):
        """Generates a 3-day Goa trip; verifies Fort Aguada, Bom Jesus, Anjuna Beach with 0 duplicates."""
        payload = {
            "title": "Goa Sunshine Gateway",
            "starting_city": "Mumbai",
            "destination": "Goa",
            "start_date": "2026-12-01",
            "end_date": "2026-12-03",
            "travelers": 2,
            "total_budget": 15000,
            "currency": "INR",
            "travel_style": "balanced",
            "interests": ["history", "nature", "relaxation"]
        }
        res = self.client.post('/api/trips', json=payload, headers=self.headers)
        self.assertEqual(res.status_code, 201)
        trip_id = res.get_json()['trip_id']

        trip_data = self.client.get(f'/api/trips/{trip_id}', headers=self.headers).get_json()['trip']
        all_acts = [a['name'] for d in trip_data['days'] for a in d['activities']]

        names_str = " ".join(all_acts)
        self.assertIn("Aguada", names_str)
        self.assertIn("Bom Jesus", names_str)
        self.assertIn("Anjuna", names_str)

        norm_names = [normalize_place_name(n) for n in all_acts]
        self.assertEqual(len(norm_names), len(set(norm_names)))

    def test_05_munnar_3day_itinerary_and_matching_photos(self):
        """Generates a 3-day Munnar trip; verifies genuine photos and 0 duplicate places."""
        payload = {
            "title": "Munnar Tea Country Discovery",
            "starting_city": "Kochi",
            "destination": "Munnar",
            "start_date": "2026-11-20",
            "end_date": "2026-11-22",
            "travelers": 2,
            "total_budget": 12000,
            "currency": "INR",
            "travel_style": "balanced",
            "interests": ["nature", "photography", "food"]
        }
        res = self.client.post('/api/trips', json=payload, headers=self.headers)
        self.assertEqual(res.status_code, 201)
        trip_id = res.get_json()['trip_id']

        trip_data = self.client.get(f'/api/trips/{trip_id}', headers=self.headers).get_json()['trip']
        self.assertIsNotNone(trip_data.get('cover_image'))

        all_activity_names = []
        for d in trip_data.get('days', []):
            day_acts = d.get('activities', [])
            for act in day_acts:
                all_activity_names.append(act['name'])
                self.assertIsNotNone(act.get('image_url'))
                if "Attukad" in act['name']:
                    self.assertIn("Attukad", act['image_url'])

        norm_names = [normalize_place_name(n) for n in all_activity_names]
        self.assertEqual(len(norm_names), len(set(norm_names)))

    def test_06_itinerary_regeneration_on_trip_update(self):
        """Verifies that changing trip destination or duration regenerates without duplicates."""
        res = self.client.post('/api/trips', json={
            "title": "Original Trip",
            "starting_city": "Pune",
            "destination": "Goa",
            "start_date": "2026-12-10",
            "end_date": "2026-12-11",
            "travelers": 1,
            "total_budget": 5000,
            "currency": "INR",
            "travel_style": "budget",
            "interests": ["history"]
        }, headers=self.headers)
        trip_id = res.get_json()['trip_id']

        # Update trip to 3-day Hyderabad trip
        update_res = self.client.put(f'/api/trips/{trip_id}', json={
            "title": "Updated Hyderabad Trip",
            "destination": "Hyderabad",
            "start_date": "2026-12-10",
            "end_date": "2026-12-12"
        }, headers=self.headers)
        self.assertEqual(update_res.status_code, 200)

        trip_data = self.client.get(f'/api/trips/{trip_id}', headers=self.headers).get_json()['trip']
        self.assertEqual(trip_data['destination'], 'Hyderabad')
        self.assertEqual(len(trip_data['days']), 3)

        all_acts = [a['name'] for d in trip_data['days'] for a in d['activities']]
        for a in all_acts:
            self.assertNotIn("Goa", a)
            self.assertNotIn("Aguada", a)

        norm_names = [normalize_place_name(n) for n in all_acts]
        self.assertEqual(len(norm_names), len(set(norm_names)))

    def test_07_photo_fallback_and_offline_resilience(self):
        """Verifies graceful handling when an attraction image is unavailable or offline."""
        res = resolve_place_image("Nonexistent Fantasy Cave 9999", "Nowhere City")
        self.assertIsNone(res.get('image_url'))
        self.assertEqual(res.get('source'), 'unavailable')

    def test_08_replacement_activity_deduplication(self):
        """Verifies that replacing an activity selects a non-duplicate alternative."""
        res = self.client.post('/api/trips', json={
            "title": "Replacement Test Trip",
            "starting_city": "Chennai",
            "destination": "Ooty",
            "start_date": "2026-12-15",
            "end_date": "2026-12-16",
            "travelers": 1,
            "total_budget": 6000,
            "currency": "INR",
            "travel_style": "balanced",
            "interests": ["nature"]
        }, headers=self.headers)
        trip_id = res.get_json()['trip_id']

        details = self.client.get(f'/api/trips/{trip_id}', headers=self.headers).get_json()['trip']
        first_act = details['days'][0]['activities'][0]

        replace_res = self.client.post(
            f'/api/itineraries/activities/{first_act["id"]}/replace',
            json={"type": "cheaper", "current_name": first_act["name"]},
            headers=self.headers
        )
        self.assertEqual(replace_res.status_code, 200)
        new_act = replace_res.get_json()['new_activity']
        self.assertNotEqual(new_act['name'], first_act['name'])
        self.assertIsNotNone(new_act.get('image_url'))

        refreshed = self.client.get(f'/api/trips/{trip_id}', headers=self.headers).get_json()['trip']
        all_acts = [a['name'] for d in refreshed['days'] for a in d['activities']]
        norm_names = [normalize_place_name(n) for n in all_acts]
        self.assertEqual(len(norm_names), len(set(norm_names)))

    def test_09_adaptive_intelligence_apply_and_undo(self):
        """Verifies that adaptive adjustments apply and undo rollback restores place_id and verification_status."""
        res = self.client.post('/api/trips', json={
            "title": "Adaptive Test Trip",
            "starting_city": "Bengaluru",
            "destination": "Hyderabad",
            "start_date": "2026-11-25",
            "end_date": "2026-11-26",
            "travelers": 1,
            "total_budget": 3000,
            "currency": "INR",
            "travel_style": "budget",
            "interests": ["history"]
        }, headers=self.headers)
        trip_id = res.get_json()['trip_id']

        # Evaluate adaptation
        eval_res = self.client.post(f'/api/adaptive/trips/{trip_id}/evaluate', json={'scenario': 'cheaper_alternatives'}, headers=self.headers)
        self.assertEqual(eval_res.status_code, 200)
        eval_data = eval_res.get_json()
        self.assertTrue(len(eval_data.get('proposed_changes', [])) > 0)

        # Apply adaptation
        changes = eval_data['proposed_changes']
        apply_res = self.client.post(f'/api/adaptive/trips/{trip_id}/apply', json={
            'changes': changes,
            'scenario': 'cheaper_alternatives'
        }, headers=self.headers)
        self.assertEqual(apply_res.status_code, 200)
        rev_id = apply_res.get_json()['revision_id']

        # Undo revision
        undo_res = self.client.post(f'/api/adaptive/trips/{trip_id}/revisions/{rev_id}/undo', headers=self.headers)
        self.assertEqual(undo_res.status_code, 200)

        # Verify restored activities have valid place_id and verification_status
        refreshed = self.client.get(f'/api/trips/{trip_id}', headers=self.headers).get_json()['trip']
        acts = [a for d in refreshed['days'] for a in d['activities']]
        self.assertTrue(len(acts) > 0)
        for a in acts:
            self.assertEqual(a.get('verification_status'), 'verified')
            self.assertIsNotNone(a.get('place_id'))

    def test_10_extended_duration_no_fake_landmarks(self):
        """Verifies that longer trips with insufficient attractions schedule explicit leisure breaks instead of fake places."""
        payload = {
            "title": "Extended Munnar Journey",
            "starting_city": "Kochi",
            "destination": "Munnar",
            "start_date": "2026-11-01",
            "end_date": "2026-11-08", # 8-day trip
            "travelers": 2,
            "total_budget": 30000,
            "currency": "INR",
            "travel_style": "comfort",
            "interests": ["nature"]
        }
        res = self.client.post('/api/trips', json=payload, headers=self.headers)
        self.assertEqual(res.status_code, 201)
        trip_id = res.get_json()['trip_id']

        trip_data = self.client.get(f'/api/trips/{trip_id}', headers=self.headers).get_json()['trip']
        all_acts = [a for d in trip_data['days'] for a in d['activities']]
        
        # Check no fake AI hallucinated landmarks appear
        for a in all_acts:
            self.assertNotIn("Scenic Riverbank", a['name'])
            self.assertNotIn("Waterfront Promenade", a['name'])
            self.assertNotIn("Hilltop Panorama", a['name'])
            self.assertNotIn("Cultural Discovery", a['name'])
            if a.get('verification_status') == 'scheduled_break':
                self.assertIn("Scheduled Rest", a['name'])
                self.assertEqual(a.get('opening_hours'), "Check current opening hours")

        # Zero duplicates among verified attractions
        verified_names = [normalize_place_name(a['name']) for a in all_acts if a.get('verification_status') == 'verified']
        self.assertEqual(len(verified_names), len(set(verified_names)))

    def test_11_match_score_contract_and_normalization(self):
        """Tests the match percentage normalization contract across all boundary values."""
        from utils_match import normalize_match_score_py

        # 0 -> 0
        self.assertEqual(normalize_match_score_py(0), 0)
        # Decimal 0.5 -> 50
        self.assertEqual(normalize_match_score_py(0.5), 50)
        # Decimal 0.8 -> 80
        self.assertEqual(normalize_match_score_py(0.8), 80)
        # Integer 50 -> 50
        self.assertEqual(normalize_match_score_py(50), 50)
        # Integer 80 -> 80
        self.assertEqual(normalize_match_score_py(80), 80)
        # Integer 100 -> 100
        self.assertEqual(normalize_match_score_py(100), 100)
        # Missing / None
        self.assertIsNone(normalize_match_score_py(None))
        self.assertIsNone(normalize_match_score_py(""))
        self.assertIsNone(normalize_match_score_py("invalid"))
        # Clamped values
        self.assertEqual(normalize_match_score_py(120), 100)
        self.assertEqual(normalize_match_score_py(-15), 0)

    def test_12_non_image_and_unsupported_media_filtering(self):
        """Verifies filtering of PDFs, HTML pages, and non-image media, and acceptance of extensionless/query endpoints."""
        from image_service import is_valid_image_url
        self.assertTrue(is_valid_image_url("https://example.com/photo.jpg"))
        self.assertTrue(is_valid_image_url("https://example.com/photo.png?size=800"))
        self.assertTrue(is_valid_image_url("https://example.com/photo.webp"))
        self.assertFalse(is_valid_image_url("https://example.com/document.pdf"))
        self.assertFalse(is_valid_image_url("https://example.com/page.html"))
        self.assertFalse(is_valid_image_url("https://example.com/video.mp4"))
        self.assertFalse(is_valid_image_url(""))
        self.assertFalse(is_valid_image_url(None))

        # Extensionless endpoints & query-based CDNs
        self.assertTrue(is_valid_image_url("https://places.googleapis.com/v1/places/ChIJ123/photos/ABC456/media?key=TEST_KEY"))
        self.assertTrue(is_valid_image_url("https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80"))
        self.assertTrue(is_valid_image_url("https://thumb.wikimedia.org/wikipedia/commons/thumb/7/71/Charminar_Hyderabad_1.jpg/960px-Charminar_Hyderabad_1.jpg"))

    def test_13_bengaluru_delhi_mumbai_agra_verification(self):
        """Verifies itinerary generation, distinct attraction photos, and 0 duplicates across Bengaluru, Delhi, Mumbai, and Agra."""
        dest_expectations = [
            ("Bengaluru", "Lalbagh", "Bangalore Palace"),
            ("Delhi", "Qutub Minar", "Red Fort"),
            ("Mumbai", "Gateway of India", "Chhatrapati Shivaji"),
            ("Agra", "Taj Mahal", "Agra Fort")
        ]

        for dest, landmark_1, landmark_2 in dest_expectations:
            res = self.client.post('/api/trips', json={
                "title": f"{dest} Discovery",
                "starting_city": "Chennai",
                "destination": dest,
                "start_date": "2026-11-20",
                "end_date": "2026-11-22",
                "travelers": 2,
                "total_budget": 12000,
                "currency": "INR",
                "travel_style": "balanced",
                "interests": ["history", "culture", "nature"]
            }, headers=self.headers)
            self.assertEqual(res.status_code, 201)
            trip_id = res.get_json()['trip_id']

            trip_data = self.client.get(f'/api/trips/{trip_id}', headers=self.headers).get_json()['trip']
            self.assertIsNotNone(trip_data.get('cover_image'))

            all_acts = [a for d in trip_data['days'] for a in d['activities']]
            all_names = [a['name'] for a in all_acts]
            all_images = [a['image_url'] for a in all_acts if a.get('image_url')]

            # Key landmarks must be present
            names_combined = " ".join(all_names)
            self.assertIn(landmark_1, names_combined)
            self.assertIn(landmark_2, names_combined)

            # Different attractions must have distinct images (no identical image reuse)
            self.assertEqual(len(all_images), len(set(all_images)), f"Duplicate images found in {dest}: {all_images}")

            # Zero duplicates across verified attractions
            verified_acts = [a for a in all_acts if a.get('verification_status') == 'verified']
            norm_names = [normalize_place_name(a['name']) for a in verified_acts]
            self.assertEqual(len(norm_names), len(set(norm_names)), f"Duplicate verified attractions found in {dest}: {norm_names}")

            # Verification fields
            for a in all_acts:
                self.assertIn(a.get('verification_status'), ['verified', 'scheduled_break'])
                self.assertIsNotNone(a.get('place_id'))
                self.assertGreaterEqual(a.get('match_score', 0), 0)
                self.assertLessEqual(a.get('match_score', 0), 100)

if __name__ == '__main__':
    unittest.main()
