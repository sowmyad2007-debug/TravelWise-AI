import unittest
import json
import os
import sys

# Ensure backend directory is in python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app import create_app
from database import get_db

class PublicAuthenticationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.app.config['TESTING'] = True
        cls.client = cls.app.test_client()

    def test_01_public_registration_success(self):
        """Verify any public user can register with standard credentials."""
        email = f"public.traveler.{os.urandom(4).hex()}@example.com"
        payload = {
            'name': 'Priya Patel',
            'email': email,
            'password': 'StrongPassword2026!',
            'confirm_password': 'StrongPassword2026!'
        }
        res = self.client.post('/api/auth/register', json=payload)
        self.assertEqual(res.status_code, 201)
        data = res.get_json()
        self.assertIn('token', data)
        self.assertEqual(data['user']['name'], 'Priya Patel')
        self.assertEqual(data['user']['email'], email.lower())

    def test_02_signup_alias_route(self):
        """Verify /api/auth/signup works as an alias to /api/auth/register."""
        email = f"signup.alias.{os.urandom(4).hex()}@example.com"
        payload = {
            'name': 'Marco Rossi',
            'email': email,
            'password': 'SecureItalian2026!',
            'confirm_password': 'SecureItalian2026!'
        }
        res = self.client.post('/api/auth/signup', json=payload)
        self.assertEqual(res.status_code, 201)
        data = res.get_json()
        self.assertIn('token', data)

    def test_03_registration_validation_rules(self):
        """Verify server-side input validation rejects invalid inputs with 400."""
        # 1. Missing name
        res = self.client.post('/api/auth/register', json={
            'name': '',
            'email': 'valid@example.com',
            'password': 'Password123!'
        })
        self.assertEqual(res.status_code, 400)

        # 2. Too short name (< 2 chars)
        res = self.client.post('/api/auth/register', json={
            'name': 'A',
            'email': 'valid@example.com',
            'password': 'Password123!'
        })
        self.assertEqual(res.status_code, 400)

        # 3. Invalid email format
        res = self.client.post('/api/auth/register', json={
            'name': 'Valid Name',
            'email': 'not-an-email',
            'password': 'Password123!'
        })
        self.assertEqual(res.status_code, 400)

        # 4. Short password (< 8 chars)
        res = self.client.post('/api/auth/register', json={
            'name': 'Valid Name',
            'email': 'valid@example.com',
            'password': 'short'
        })
        self.assertEqual(res.status_code, 400)

        # 5. Mismatched passwords
        res = self.client.post('/api/auth/register', json={
            'name': 'Valid Name',
            'email': 'valid@example.com',
            'password': 'Password123!',
            'confirm_password': 'DifferentPassword123!'
        })
        self.assertEqual(res.status_code, 400)

    def test_04_duplicate_registration_rejected(self):
        """Verify duplicate registration returns 409 Conflict with friendly message."""
        email = f"duplicate.test.{os.urandom(4).hex()}@example.com"
        payload = {
            'name': 'Duplicate User',
            'email': email,
            'password': 'Password123!',
            'confirm_password': 'Password123!'
        }
        # First registration
        res1 = self.client.post('/api/auth/register', json=payload)
        self.assertEqual(res1.status_code, 201)

        # Second registration with identical email
        res2 = self.client.post('/api/auth/register', json=payload)
        self.assertEqual(res2.status_code, 409)
        self.assertIn('already exists', res2.get_json()['error'])

        # Third registration with uppercase version of same email
        payload['email'] = email.upper()
        res3 = self.client.post('/api/auth/register', json=payload)
        self.assertEqual(res3.status_code, 409)

    def test_05_login_and_security(self):
        """Verify login credentials, generic 401 response, and JWT token issuance."""
        email = f"auth.user.{os.urandom(4).hex()}@example.com"
        password = 'MySecretPassword123!'
        self.client.post('/api/auth/register', json={
            'name': 'Auth Test User',
            'email': email,
            'password': password,
            'confirm_password': password
        })

        # 1. Successful login
        login_res = self.client.post('/api/auth/login', json={'email': email, 'password': password})
        self.assertEqual(login_res.status_code, 200)
        token = login_res.get_json()['token']
        self.assertTrue(bool(token))

        # 2. Failed login (wrong password)
        bad_pw = self.client.post('/api/auth/login', json={'email': email, 'password': 'WrongPassword999!'})
        self.assertEqual(bad_pw.status_code, 401)
        self.assertEqual(bad_pw.get_json()['error'], 'Invalid email or password.')

        # 3. Failed login (nonexistent email)
        no_email = self.client.post('/api/auth/login', json={'email': 'nobody@nonexistent.domain', 'password': password})
        self.assertEqual(no_email.status_code, 401)
        self.assertEqual(no_email.get_json()['error'], 'Invalid email or password.')

    def test_06_session_verification_and_logout(self):
        """Verify /api/auth/me token decoding and /api/auth/logout endpoint."""
        email = f"session.{os.urandom(4).hex()}@example.com"
        reg = self.client.post('/api/auth/register', json={
            'name': 'Session User',
            'email': email,
            'password': 'Password123!',
            'confirm_password': 'Password123!'
        })
        token = reg.get_json()['token']

        # Valid session query
        me_res = self.client.get('/api/auth/me', headers={'Authorization': f'Bearer {token}'})
        self.assertEqual(me_res.status_code, 200)
        self.assertEqual(me_res.get_json()['user']['email'], email.lower())

        # Missing token
        no_token = self.client.get('/api/auth/me')
        self.assertEqual(no_token.status_code, 401)

        # Invalid token
        bad_token = self.client.get('/api/auth/me', headers={'Authorization': 'Bearer invalid.fake.token'})
        self.assertEqual(bad_token.status_code, 401)

        # Logout endpoint
        logout_res = self.client.post('/api/auth/logout')
        self.assertEqual(logout_res.status_code, 200)

    def test_07_user_data_isolation(self):
        """Verify new users start with 0 trips and have strict data isolation."""
        user1_email = f"isolated.one.{os.urandom(4).hex()}@example.com"
        user2_email = f"isolated.two.{os.urandom(4).hex()}@example.com"

        reg1 = self.client.post('/api/auth/register', json={
            'name': 'User One',
            'email': user1_email,
            'password': 'Password123!',
            'confirm_password': 'Password123!'
        })
        token1 = reg1.get_json()['token']

        reg2 = self.client.post('/api/auth/register', json={
            'name': 'User Two',
            'email': user2_email,
            'password': 'Password123!',
            'confirm_password': 'Password123!'
        })
        token2 = reg2.get_json()['token']

        # User 1 starts with 0 trips
        trips1 = self.client.get('/api/trips', headers={'Authorization': f'Bearer {token1}'})
        self.assertEqual(trips1.status_code, 200)
        self.assertEqual(len(trips1.get_json()['trips']), 0)

        # User 2 starts with 0 trips
        trips2 = self.client.get('/api/trips', headers={'Authorization': f'Bearer {token2}'})
        self.assertEqual(trips2.status_code, 200)
        self.assertEqual(len(trips2.get_json()['trips']), 0)

        # User 1 creates a trip
        create_res = self.client.post('/api/trips', json={
            'title': 'User 1 Jaipur Expedition',
            'destination': 'Jaipur',
            'starting_city': 'Delhi',
            'start_date': '2026-12-01',
            'end_date': '2026-12-03',
            'total_budget': 15000,
            'travel_style': 'balanced',
            'interests': ['history', 'photography']
        }, headers={'Authorization': f'Bearer {token1}'})
        self.assertEqual(create_res.status_code, 201)
        trip1_id = create_res.get_json()['trip_id']

        # User 1 sees 1 trip
        user1_trips = self.client.get('/api/trips', headers={'Authorization': f'Bearer {token1}'}).get_json()['trips']
        self.assertEqual(len(user1_trips), 1)
        self.assertEqual(user1_trips[0]['id'], trip1_id)

        # User 2 still sees 0 trips (data isolation guarantee)
        user2_trips = self.client.get('/api/trips', headers={'Authorization': f'Bearer {token2}'}).get_json()['trips']
        self.assertEqual(len(user2_trips), 0)

        # User 2 cannot access User 1's trip details
        unauth_detail = self.client.get(f'/api/trips/{trip1_id}', headers={'Authorization': f'Bearer {token2}'})
        self.assertEqual(unauth_detail.status_code, 404)

    def test_08_cors_preflight_options(self):
        """Verify OPTIONS preflight request succeeds with CORS headers for Vercel origin."""
        headers = {
            'Origin': 'https://travelwiseai-taupe.vercel.app',
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'Content-Type, Authorization'
        }
        res = self.client.open('/api/auth/register', method='OPTIONS', headers=headers)
        self.assertIn(res.status_code, [200, 204])
        self.assertIn('Access-Control-Allow-Origin', res.headers)
        self.assertEqual(res.headers.get('Access-Control-Allow-Origin'), 'https://travelwiseai-taupe.vercel.app')
        self.assertIn('Access-Control-Allow-Methods', res.headers)

if __name__ == '__main__':
    unittest.main()
