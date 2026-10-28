import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

import unittest
import json
import io
from app import create_app
from database import get_db
from auth import generate_jwt, RATE_LIMIT_STORE

class TestReceiptManagement(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        RATE_LIMIT_STORE.clear()
        cls.app = create_app()
        cls.client = cls.app.test_client()

        # Generate tokens directly
        cls.token1 = generate_jwt(1, 'demo@travelwise.ai')
        cls.headers1 = {'Authorization': f'Bearer {cls.token1}'}

        # Ensure User 2 exists in database for isolation test
        with get_db() as conn:
            conn.execute("INSERT OR IGNORE INTO users (id, name, email, password_hash) VALUES (999, 'User 2', 'user2@isolated.test', 'dummy_hash')")
        cls.token2 = generate_jwt(999, 'user2@isolated.test')
        cls.headers2 = {'Authorization': f'Bearer {cls.token2}'}

        # Ensure User 1 has a trip
        with get_db() as conn:
            trip = conn.execute("SELECT id FROM trips WHERE user_id = 1 LIMIT 1").fetchone()
            if trip:
                cls.trip_id = trip['id']
            else:
                r = conn.execute(
                    "INSERT INTO trips (user_id, destination, title, start_date, end_date, total_budget) VALUES (1, 'Goa', 'Goa Holiday', '2026-11-01', '2026-11-05', 20000.0)"
                )
                cls.trip_id = r.lastrowid

    def test_01_upload_scan_valid_image(self):
        """Test uploading a valid JPG receipt and receiving upload token."""
        fake_jpg = io.BytesIO(b'\xff\xd8\xff\xe0\x00\x10JFIF' + b'\x00' * 500)
        data = {
            'file': (fake_jpg, 'dinner_receipt.jpg', 'image/jpeg')
        }
        res = self.client.post(
            '/api/receipts/upload-scan',
            data=data,
            content_type='multipart/form-data',
            headers=self.headers1
        )
        self.assertEqual(res.status_code, 200)
        body = res.get_json()
        self.assertIn('file_token', body)
        self.assertEqual(body['file_name'], 'dinner_receipt.jpg')
        self.assertGreater(body['file_size'], 0)

    def test_02_upload_scan_valid_pdf(self):
        """Test uploading a valid PDF document."""
        fake_pdf = io.BytesIO(b'%PDF-1.4 header' + b'\x00' * 300)
        data = {
            'file': (fake_pdf, 'flight_invoice.pdf', 'application/pdf')
        }
        res = self.client.post(
            '/api/receipts/upload-scan',
            data=data,
            content_type='multipart/form-data',
            headers=self.headers1
        )
        self.assertEqual(res.status_code, 200)
        body = res.get_json()
        self.assertIn('file_token', body)
        self.assertEqual(body['mime_type'], 'application/pdf')

    def test_03_reject_invalid_file_extension(self):
        """Test rejecting prohibited file types (e.g., .exe, .sh, .txt)."""
        bad_file = io.BytesIO(b'malicious payload')
        data = {
            'file': (bad_file, 'payload.exe', 'application/octet-stream')
        }
        res = self.client.post(
            '/api/receipts/upload-scan',
            data=data,
            content_type='multipart/form-data',
            headers=self.headers1
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn('Unsupported file type', res.get_json()['error'])

    def test_04_reject_oversized_file(self):
        """Test rejecting files that exceed the 10MB limit."""
        huge_file = io.BytesIO(b'0' * (11 * 1024 * 1024))
        data = {
            'file': (huge_file, 'large_receipt.png', 'image/png')
        }
        res = self.client.post(
            '/api/receipts/upload-scan',
            data=data,
            content_type='multipart/form-data',
            headers=self.headers1
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn('10MB limit', res.get_json()['error'])

    def test_05_create_and_fetch_receipt(self):
        """Test saving a receipt record and retrieving it in list and detail endpoints."""
        fake_img = io.BytesIO(b'\x89PNG\r\n\x1a\n' + b'\x00' * 400)
        up_res = self.client.post(
            '/api/receipts/upload-scan',
            data={'file': (fake_img, 'hotel_bill.png', 'image/png')},
            content_type='multipart/form-data',
            headers=self.headers1
        )
        token = up_res.get_json()['file_token']

        # Save receipt
        save_res = self.client.post('/api/receipts', json={
            'file_token': token,
            'title': 'Taj Fort Aguada Stay',
            'merchant_name': 'Taj Hotels Resort',
            'amount': 4500.0,
            'currency': 'INR',
            'date': '2026-11-02',
            'category': 'accommodation',
            'payment_method': 'credit_card',
            'trip_id': self.trip_id,
            'notes': 'Room 304 luxury sea view',
            'create_expense': False
        }, headers=self.headers1)
        self.assertEqual(save_res.status_code, 201)
        receipt_id = save_res.get_json()['receipt_id']

        # Fetch detail
        detail_res = self.client.get(f'/api/receipts/{receipt_id}', headers=self.headers1)
        self.assertEqual(detail_res.status_code, 200)
        rec = detail_res.get_json()['receipt']
        self.assertEqual(rec['title'], 'Taj Fort Aguada Stay')
        self.assertEqual(rec['amount'], 4500.0)
        self.assertEqual(rec['category'], 'accommodation')
        self.assertEqual(rec['trip_id'], self.trip_id)

        # Fetch list
        list_res = self.client.get('/api/receipts', headers=self.headers1)
        self.assertEqual(list_res.status_code, 200)
        body = list_res.get_json()
        self.assertIn('receipts', body)
        self.assertIn('summary', body)
        self.assertGreaterEqual(body['summary']['total_amount'], 4500.0)
        self.assertGreaterEqual(body['summary']['total_count'], 1)

    def test_06_user_isolation_security(self):
        """Test that User 2 CANNOT access or download User 1's receipts."""
        fake_img = io.BytesIO(b'\xff\xd8\xff' + b'\x00' * 100)
        up_res = self.client.post(
            '/api/receipts/upload-scan',
            data={'file': (fake_img, 'private_user1_bill.jpg', 'image/jpeg')},
            content_type='multipart/form-data',
            headers=self.headers1
        )
        token = up_res.get_json()['file_token']

        save_res = self.client.post('/api/receipts', json={
            'file_token': token,
            'title': 'User 1 Confidential Bill',
            'amount': 1200.0,
            'category': 'food'
        }, headers=self.headers1)
        receipt_id = save_res.get_json()['receipt_id']

        # User 2 attempts to get detail -> 404
        u2_detail = self.client.get(f'/api/receipts/{receipt_id}', headers=self.headers2)
        self.assertEqual(u2_detail.status_code, 404)

        # User 2 attempts to download file -> 404
        u2_file = self.client.get(f'/api/receipts/{receipt_id}/file', headers=self.headers2)
        self.assertEqual(u2_file.status_code, 404)

        # User 2 attempts to delete -> 404
        u2_del = self.client.delete(f'/api/receipts/{receipt_id}', headers=self.headers2)
        self.assertEqual(u2_del.status_code, 404)

    def test_07_convert_to_expense_integration(self):
        """Test converting receipt into a linked expense and preventing duplicate creation."""
        fake_img = io.BytesIO(b'\xff\xd8\xff' + b'\x00' * 200)
        up_res = self.client.post(
            '/api/receipts/upload-scan',
            data={'file': (fake_img, 'seafood_shack.jpg', 'image/jpeg')},
            content_type='multipart/form-data',
            headers=self.headers1
        )
        token = up_res.get_json()['file_token']

        save_res = self.client.post('/api/receipts', json={
            'file_token': token,
            'title': 'Fishermans Wharf Dinner',
            'merchant_name': 'Fishermans Wharf',
            'amount': 2200.0,
            'category': 'food',
            'trip_id': self.trip_id,
            'create_expense': False
        }, headers=self.headers1)
        receipt_id = save_res.get_json()['receipt_id']

        # Convert to expense
        conv_res = self.client.post(f'/api/receipts/{receipt_id}/convert-to-expense', json={
            'trip_id': self.trip_id
        }, headers=self.headers1)
        self.assertEqual(conv_res.status_code, 201)
        exp_id = conv_res.get_json()['expense_id']
        self.assertIsNotNone(exp_id)

        # Try to convert again -> expect duplicate rejection (HTTP 400)
        dup_res = self.client.post(f'/api/receipts/{receipt_id}/convert-to-expense', json={
            'trip_id': self.trip_id
        }, headers=self.headers1)
        self.assertEqual(dup_res.status_code, 400)
        self.assertIn('already linked', dup_res.get_json()['error'])

        # Verify expense appears in trip expenses endpoint
        exp_list = self.client.get(f'/api/expenses/trips/{self.trip_id}', headers=self.headers1)
        self.assertEqual(exp_list.status_code, 200)
        exp_ids = [e['id'] for e in exp_list.get_json()['expenses']]
        self.assertIn(exp_id, exp_ids)

    def test_08_csv_export(self):
        """Test CSV export endpoint returns valid CSV with headers and records."""
        res = self.client.get('/api/receipts/export', headers=self.headers1)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.mimetype, 'text/csv')
        self.assertIn('attachment', res.headers.get('Content-Disposition', ''))
        content = res.data.decode('utf-8')
        self.assertIn('Receipt ID,Title,Merchant Name,Amount', content)

    def test_09_edit_and_delete_receipt(self):
        """Test updating receipt fields and deleting receipt with clean unlink."""
        fake_img = io.BytesIO(b'%PDF-1.4' + b'\x00' * 100)
        up_res = self.client.post(
            '/api/receipts/upload-scan',
            data={'file': (fake_img, 'scooter_rental.pdf', 'application/pdf')},
            content_type='multipart/form-data',
            headers=self.headers1
        )
        token = up_res.get_json()['file_token']

        save_res = self.client.post('/api/receipts', json={
            'file_token': token,
            'title': 'Scooter Rental Initial',
            'amount': 800.0,
            'category': 'transport'
        }, headers=self.headers1)
        receipt_id = save_res.get_json()['receipt_id']

        # Edit receipt
        edit_res = self.client.put(f'/api/receipts/{receipt_id}', json={
            'title': 'Scooter Rental 2 Days',
            'amount': 1500.0,
            'notes': 'Honda Activa 125cc'
        }, headers=self.headers1)
        self.assertEqual(edit_res.status_code, 200)

        # Verify update
        get_res = self.client.get(f'/api/receipts/{receipt_id}', headers=self.headers1)
        self.assertEqual(get_res.get_json()['receipt']['title'], 'Scooter Rental 2 Days')
        self.assertEqual(get_res.get_json()['receipt']['amount'], 1500.0)

        # Delete receipt
        del_res = self.client.delete(f'/api/receipts/{receipt_id}', headers=self.headers1)
        self.assertEqual(del_res.status_code, 200)

        # Verify 404 after deletion
        get_after = self.client.get(f'/api/receipts/{receipt_id}', headers=self.headers1)
        self.assertEqual(get_after.status_code, 404)

if __name__ == '__main__':
    unittest.main()
