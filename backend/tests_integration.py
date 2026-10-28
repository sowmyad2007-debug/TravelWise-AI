import unittest
import json
import os
import sys

# Ensure backend directory is in python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app import create_app
from database import get_db

class TravelWiseIntegrationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.app.config['TESTING'] = True
        cls.client = cls.app.test_client()

    def test_01_health_check(self):
        res = self.client.get('/api/health')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data['status'], 'healthy')
        self.assertEqual(data['service'], 'TravelWise AI+ Adaptive Backend')

    def test_02_auth_workflow(self):
        # 1. Register a new user
        test_email = 'traveler.test@example.com'
        reg_payload = {
            'name': 'Test Traveler',
            'email': test_email,
            'password': 'SecurePassword123!',
            'confirm_password': 'SecurePassword123!'
        }
        res = self.client.post('/api/auth/register', json=reg_payload)
        self.assertIn(res.status_code, [201, 409]) # 201 created or 409 if already exists

        # 2. Duplicate registration test
        res_dup = self.client.post('/api/auth/register', json=reg_payload)
        self.assertEqual(res_dup.status_code, 409)

        # 3. Invalid login attempt
        bad_login = self.client.post('/api/auth/login', json={'email': test_email, 'password': 'WrongPassword!'})
        self.assertEqual(bad_login.status_code, 401)

        # 4. Valid login
        good_login = self.client.post('/api/auth/login', json={'email': test_email, 'password': 'SecurePassword123!'})
        self.assertEqual(good_login.status_code, 200)
        token = good_login.get_json()['token']
        self.assertTrue(bool(token))

        # 5. Protected profile access
        headers = {'Authorization': f'Bearer {token}'}
        me_res = self.client.get('/api/auth/me', headers=headers)
        self.assertEqual(me_res.status_code, 200)
        self.assertEqual(me_res.get_json()['user']['email'], test_email)

        # 6. Update Profile
        update_res = self.client.put('/api/auth/profile', json={
            'name': 'Test Traveler Updated',
            'preferred_currency': 'INR',
            'preferred_travel_style': 'budget',
            'preferred_interests': ['nature', 'adventure']
        }, headers=headers)
        self.assertEqual(update_res.status_code, 200)
        self.assertEqual(update_res.get_json()['user']['name'], 'Test Traveler Updated')

    def test_03_forgot_and_reset_password(self):
        email = 'reset.test@example.com'
        # Register user first
        self.client.post('/api/auth/register', json={
            'name': 'Reset User',
            'email': email,
            'password': 'OldPassword123!',
            'confirm_password': 'OldPassword123!'
        })

        # Forgot password request
        forgot_res = self.client.post('/api/auth/forgot-password', json={'email': email})
        self.assertEqual(forgot_res.status_code, 200)
        data = forgot_res.get_json()
        dev_token = data.get('dev_reset_token')
        self.assertIsNotNone(dev_token)

        # Reset password with token
        reset_res = self.client.post('/api/auth/reset-password', json={
            'token': dev_token,
            'new_password': 'BrandNewPassword123!',
            'confirm_password': 'BrandNewPassword123!'
        })
        self.assertEqual(reset_res.status_code, 200)

        # Verify old password fails
        fail_login = self.client.post('/api/auth/login', json={'email': email, 'password': 'OldPassword123!'})
        self.assertEqual(fail_login.status_code, 401)

        # Verify new password succeeds
        pass_login = self.client.post('/api/auth/login', json={'email': email, 'password': 'BrandNewPassword123!'})
        self.assertEqual(pass_login.status_code, 200)

    def test_04_trip_creation_and_authorization(self):
        # Login demo user
        login_res = self.client.post('/api/auth/login', json={'email': 'demo@travelwise.ai', 'password': 'Password123!'})
        token = login_res.get_json()['token']
        headers = {'Authorization': f'Bearer {token}'}

        # Create new trip to Goa
        trip_payload = {
            'starting_city': 'Mumbai',
            'destination': 'Goa',
            'start_date': '2026-12-01',
            'end_date': '2026-12-04',
            'travelers': 2,
            'total_budget': 15000.0,
            'currency': 'INR',
            'travel_style': 'balanced',
            'interests': ['history', 'photography', 'food'],
            'accommodation_pref': 'midrange_hotel',
            'dietary_pref': 'no_preference',
            'accessibility_pref': 'standard'
        }

        res = self.client.post('/api/trips', json=trip_payload, headers=headers)
        self.assertEqual(res.status_code, 201)
        trip_id = res.get_json()['trip_id']
        self.assertTrue(trip_id > 0)

        # Fetch trip details
        details_res = self.client.get(f'/api/trips/{trip_id}', headers=headers)
        self.assertEqual(details_res.status_code, 200)
        trip = details_res.get_json()['trip']
        self.assertEqual(trip['destination'], 'Goa')
        self.assertEqual(len(trip['days']), 4)
        self.assertTrue(len(trip['days'][0]['activities']) >= 2)

        # Unauthorized access test by another user
        self.client.post('/api/auth/register', json={
            'name': 'Other User',
            'email': 'other@example.com',
            'password': 'OtherPassword123!',
            'confirm_password': 'OtherPassword123!'
        })
        other_login = self.client.post('/api/auth/login', json={'email': 'other@example.com', 'password': 'OtherPassword123!'})
        other_headers = {'Authorization': f"Bearer {other_login.get_json()['token']}"}

        # Attempt to access user 1's trip
        unauth_res = self.client.get(f'/api/trips/{trip_id}', headers=other_headers)
        self.assertEqual(unauth_res.status_code, 404)

    def test_05_budget_and_expenses(self):
        login_res = self.client.post('/api/auth/login', json={'email': 'demo@travelwise.ai', 'password': 'Password123!'})
        headers = {'Authorization': f"Bearer {login_res.get_json()['token']}"}

        # Trip 1 was pre-seeded for demo user
        exp_payload = {
            'title': 'Dinner at Ooty Shinkows',
            'category': 'food',
            'amount': 850.0,
            'date': '2026-11-10',
            'notes': 'Chinese dinner',
            'payer_name': 'Alex Chen',
            'is_shared': True
        }
        add_res = self.client.post('/api/expenses/trips/1', json=exp_payload, headers=headers)
        self.assertEqual(add_res.status_code, 201)
        exp_id = add_res.get_json()['expense_id']

        # Get summary and verify calculations
        sum_res = self.client.get('/api/expenses/trips/1', headers=headers)
        self.assertEqual(sum_res.status_code, 200)
        data = sum_res.get_json()
        self.assertGreater(data['summary']['total_spent'], 850.0)
        self.assertEqual(data['summary']['currency'], 'INR')

        # Delete expense and check recalculation
        del_res = self.client.delete(f'/api/expenses/{exp_id}', headers=headers)
        self.assertEqual(del_res.status_code, 200)

    def test_06_adaptive_travel_intelligence(self):
        login_res = self.client.post('/api/auth/login', json={'email': 'demo@travelwise.ai', 'password': 'Password123!'})
        headers = {'Authorization': f"Bearer {login_res.get_json()['token']}"}

        # 1. Evaluate Rain Scenario
        eval_res = self.client.post('/api/adaptive/trips/1/evaluate', json={'scenario': 'rain'}, headers=headers)
        self.assertEqual(eval_res.status_code, 200)
        eval_data = eval_res.get_json()
        self.assertFalse(eval_data['applied'])
        self.assertIn('proposed_changes', eval_data)

        # 2. Evaluate Overspent Scenario
        over_res = self.client.post('/api/adaptive/trips/1/evaluate', json={'scenario': 'overspent'}, headers=headers)
        self.assertEqual(over_res.status_code, 200)
        over_data = over_res.get_json()
        self.assertIn('total_savings', over_data)

        # 3. Apply changes with confirmation
        if over_data['proposed_changes']:
            apply_res = self.client.post('/api/adaptive/trips/1/apply', json={'changes': over_data['proposed_changes']}, headers=headers)
            self.assertEqual(apply_res.status_code, 200)
            self.assertIn('applied_count', apply_res.get_json())

    def test_07_group_splitter_and_chatbot(self):
        login_res = self.client.post('/api/auth/login', json={'email': 'demo@travelwise.ai', 'password': 'Password123!'})
        headers = {'Authorization': f"Bearer {login_res.get_json()['token']}"}

        # Group Split Summary
        split_res = self.client.get('/api/group/trips/1/split-summary', headers=headers)
        self.assertEqual(split_res.status_code, 200)
        split_data = split_res.get_json()
        self.assertIn('balances', split_data)
        self.assertIn('settlements', split_data)

        # Chatbot prompt
        chat_res = self.client.post('/api/chatbot/trips/1/ask', json={'message': 'How much did I spend on food?'}, headers=headers)
        self.assertEqual(chat_res.status_code, 200)
        chat_data = chat_res.get_json()
        self.assertIn('food', chat_data['reply'].lower())
        self.assertEqual(chat_data['action_type'], 'view_category')

    def test_08_travel_helper_and_support_ticket(self):
        # Public resources endpoint
        res = self.client.get('/api/helper/resources')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(len(data['emergency_contacts']) >= 5)
        self.assertTrue(len(data['faqs']) >= 4)
        self.assertIn('Tamil (Ooty / Nilgiris / Chennai)', data['language_phrases'])

        # Submit support ticket
        ticket_res = self.client.post('/api/helper/support-tickets', json={
            'name': 'Demonstration Evaluator',
            'email': 'evaluator@university.edu',
            'category': 'Adaptive Engine Suggestion',
            'subject': 'Evaluation of TravelWise AI+ Capstone',
            'message': 'Testing support ticket persistence and demo mode notice.',
            'priority': 'high'
        })
        self.assertEqual(ticket_res.status_code, 201)
        self.assertIn('TW-SUP-', ticket_res.get_json()['ticket_id'])

    def test_09_revision_history_and_undo(self):
        login_res = self.client.post('/api/auth/login', json={'email': 'demo@travelwise.ai', 'password': 'Password123!'})
        headers = {'Authorization': f"Bearer {login_res.get_json()['token']}"}

        # 1. Evaluate overspent scenario
        eval_res = self.client.post('/api/adaptive/trips/1/evaluate', json={'scenario': 'overspent'}, headers=headers)
        self.assertEqual(eval_res.status_code, 200)
        eval_data = eval_res.get_json()
        proposed = eval_data.get('proposed_changes', [])

        if proposed:
            # 2. Apply proposed change
            apply_res = self.client.post(
                '/api/adaptive/trips/1/apply',
                json={'changes': proposed, 'scenario': 'overspent'},
                headers=headers
            )
            self.assertEqual(apply_res.status_code, 200)
            rev_id = apply_res.get_json().get('revision_id')
            self.assertIsNotNone(rev_id)

            # 3. Retrieve revision history
            revs_res = self.client.get('/api/adaptive/trips/1/revisions', headers=headers)
            self.assertEqual(revs_res.status_code, 200)
            revs_data = revs_res.get_json()
            self.assertTrue(len(revs_data['revisions']) >= 1)
            latest_rev = revs_data['revisions'][0]
            self.assertEqual(latest_rev['id'], rev_id)
            self.assertEqual(latest_rev['can_undo'], 1)

            # 4. Undo revision
            undo_res = self.client.post(f'/api/adaptive/trips/1/revisions/{rev_id}/undo', headers=headers)
            self.assertEqual(undo_res.status_code, 200)
            self.assertIn('undone_revision_id', undo_res.get_json())

            # 5. Verify revision is now marked non-undoable
            revs_res_after = self.client.get('/api/adaptive/trips/1/revisions', headers=headers)
            rev_after = next(r for r in revs_res_after.get_json()['revisions'] if r['id'] == rev_id)
            self.assertEqual(rev_after['can_undo'], 0)

    def test_10_weather_endpoint_and_multi_factor_scoring(self):
        login_res = self.client.post('/api/auth/login', json={'email': 'demo@travelwise.ai', 'password': 'Password123!'})
        headers = {'Authorization': f"Bearer {login_res.get_json()['token']}"}

        # 1. Destination weather endpoint
        weather_res = self.client.get('/api/trips/1/weather', headers=headers)
        self.assertEqual(weather_res.status_code, 200)
        w_data = weather_res.get_json()
        self.assertEqual(w_data['destination'], 'Ooty')
        self.assertIn('weather', w_data)
        weather = w_data['weather']
        self.assertIn('temperature_c', weather)
        self.assertIn('condition', weather)
        self.assertIn('source', weather)

        # 2. Trip details contain weather and multi-factor metadata
        trip_res = self.client.get('/api/trips/1', headers=headers)
        self.assertEqual(trip_res.status_code, 200)
        trip_obj = trip_res.get_json()['trip']
        self.assertIn('weather', trip_obj)

    def test_11_three_tier_budget_and_receipt_upload(self):
        login_res = self.client.post('/api/auth/login', json={'email': 'demo@travelwise.ai', 'password': 'Password123!'})
        headers = {'Authorization': f"Bearer {login_res.get_json()['token']}"}

        # 1. Verify Three-Tier summary fields
        exp_res = self.client.get('/api/expenses/trips/1', headers=headers)
        self.assertEqual(exp_res.status_code, 200)
        summary = exp_res.get_json()['summary']
        self.assertIn('estimated_future_commitments', summary)
        self.assertIn('projected_final_spending', summary)
        self.assertIn('forecast_confidence', summary)
        self.assertIn('level', summary['forecast_confidence'])

        # 2. Receipt upload validation - file too large (>5MB)
        bad_upload = self.client.post(
            '/api/expenses/trips/1/receipt-mock-upload',
            json={'filename': 'huge_bill.pdf', 'file_size_bytes': 6 * 1024 * 1024, 'mime_type': 'application/pdf'},
            headers=headers
        )
        self.assertEqual(bad_upload.status_code, 400)
        self.assertIn('5MB', bad_upload.get_json()['error'])

        # 3. Receipt upload validation - invalid MIME
        bad_mime = self.client.post(
            '/api/expenses/trips/1/receipt-mock-upload',
            json={'filename': 'malicious.exe', 'file_size_bytes': 1024, 'mime_type': 'application/x-msdownload'},
            headers=headers
        )
        self.assertEqual(bad_mime.status_code, 400)

        # 4. Valid receipt mock upload
        good_upload = self.client.post(
            '/api/expenses/trips/1/receipt-mock-upload',
            json={'filename': 'hotel_bill.jpg', 'file_size_bytes': 250000, 'mime_type': 'image/jpeg'},
            headers=headers
        )
        self.assertEqual(good_upload.status_code, 200)
        self.assertIn('extracted_data', good_upload.get_json())

    def test_12_group_splitter_invariant_check(self):
        login_res = self.client.post('/api/auth/login', json={'email': 'demo@travelwise.ai', 'password': 'Password123!'})
        headers = {'Authorization': f"Bearer {login_res.get_json()['token']}"}

        split_res = self.client.get('/api/group/trips/1/split-summary', headers=headers)
        self.assertEqual(split_res.status_code, 200)
        data = split_res.get_json()
        balances = data.get('balances', [])
        
        # Invariant: Net balance sum must equal 0 (within floating rounding tolerance)
        net_sum = sum(b['net_balance'] for b in balances)
        self.assertAlmostEqual(net_sum, 0.0, places=1)

if __name__ == '__main__':
    unittest.main()
