"""
TravelWise AI+ 2.0 — Receipt Management & Invoice Vault Module.
Provides secure multi-format receipt file uploads (JPG, JPEG, PNG, PDF),
optional AI OCR scanning via Google GenAI, strict user isolation,
integration with Expense Tracker 2.0, filtering, and CSV export.
"""

import os
import io
import csv
import json
import time
import uuid
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, Any, Tuple

from flask import Blueprint, request, jsonify, send_file, Response
from werkzeug.utils import secure_filename

from auth import require_auth
from database import get_db
from config import GEMINI_API_KEY

receipts_bp = Blueprint('receipts', __name__, url_prefix='/api/receipts')

# Storage Configuration
BACKEND_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BACKEND_DIR / 'uploads' / 'receipts'
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Add .gitignore in uploads folder to prevent committing user files
GITIGNORE_PATH = UPLOAD_DIR / '.gitignore'
if not GITIGNORE_PATH.exists():
    with open(GITIGNORE_PATH, 'w') as f:
        f.write("*\n!.gitignore\n")

ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'pdf'}
ALLOWED_MIME_TYPES = {
    'image/jpeg',
    'image/png',
    'image/jpg',
    'application/pdf'
}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10MB limit

VALID_CATEGORIES = {'food', 'transport', 'accommodation', 'shopping', 'activities', 'other'}
VALID_PAYMENT_METHODS = {'cash', 'credit_card', 'debit_card', 'upi', 'net_banking', 'other'}

# Optional GenAI Client
genai_client = None
if GEMINI_API_KEY:
    try:
        from google import genai
        genai_client = genai.Client(api_key=GEMINI_API_KEY)
    except Exception as e:
        print(f"[Receipts] Google GenAI SDK init error: {e}")
        genai_client = None


def is_allowed_file(filename: str, mimetype: str) -> Tuple[bool, str]:
    """Validates filename extension and reported MIME type."""
    if not filename or '.' not in filename:
        return False, "File name must include a valid extension."
    
    ext = filename.rsplit('.', 1)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        return False, f"Unsupported file type .{ext}. Allowed: JPG, JPEG, PNG, PDF."
    
    # Check mime type if provided
    if mimetype:
        mime_clean = mimetype.lower().split(';')[0].strip()
        if mime_clean not in ALLOWED_MIME_TYPES and mime_clean != 'application/octet-stream':
            return False, f"Unsupported MIME type '{mime_clean}'. Allowed: JPEG, PNG, PDF."
            
    return True, ext


def perform_ai_ocr(file_bytes: bytes, mime_type: str, filename: str) -> Tuple[bool, Dict[str, Any], str]:
    """
    Attempts to extract structured financial data using Gemini 2.5 Flash if available.
    Does NOT hallucinate or fake data if OCR is disabled or fails.
    """
    if not genai_client:
        return False, {}, "AI OCR service is not configured. Manual entry is active."
    
    # Only images are sent to Gemini vision; PDFs without PDF extractors fall back cleanly
    if not mime_type.startswith('image/'):
        return False, {}, "AI OCR is supported for JPEG and PNG images. For PDFs, enter details manually."

    try:
        from google.genai import types
        
        prompt = (
            "You are an expert receipt parser and expense accountant. Analyze this receipt or bill image "
            "and extract the following structured JSON:\n"
            "{\n"
            '  "merchant_name": "string (name of store, restaurant, vendor, or airline; null if unclear)",\n'
            '  "amount": float (final total amount paid; null if unclear),\n'
            '  "currency": "string (3-letter ISO code e.g. INR, USD, EUR, GBP; default to INR if Indian rupees symbol or context)",\n'
            '  "date": "YYYY-MM-DD (date of purchase or transaction; null if unclear)",\n'
            '  "category": "one of: food, transport, accommodation, shopping, activities, other",\n'
            '  "payment_method": "one of: cash, credit_card, debit_card, upi, net_banking, other",\n'
            '  "notes": "string (brief summary of purchased items or service)"\n'
            "}\n"
            "Return valid JSON only, without markdown fences or additional text."
        )

        response = genai_client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[
                types.Part.from_bytes(data=file_bytes, mime_type=mime_type),
                prompt
            ]
        )

        raw_text = (response.text or "").strip()
        # Strip potential markdown fences
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:]
        if raw_text.startswith("```"):
            raw_text = raw_text[3:]
        if raw_text.endswith("```"):
            raw_text = raw_text[:-3]
        raw_text = raw_text.strip()

        data = json.loads(raw_text)
        
        # Sanitize category
        cat = str(data.get("category", "")).lower()
        if cat not in VALID_CATEGORIES:
            data["category"] = "other"
            
        # Sanitize payment method
        pm = str(data.get("payment_method", "")).lower()
        if pm not in VALID_PAYMENT_METHODS:
            data["payment_method"] = "credit_card"
            
        return True, data, "Data extracted successfully via Gemini AI."
    except Exception as e:
        print(f"[Receipts] OCR extraction error: {e}")
        return False, {}, f"OCR parsing could not extract details: {str(e)}"


# Temp file cache for two-step upload-scan flow
TEMP_UPLOADS: Dict[str, Dict[str, Any]] = {}


@receipts_bp.route('/upload-scan', methods=['POST'])
@require_auth
def upload_and_scan():
    """
    Step 1 (optional scan): Validates uploaded receipt file, stores it safely on server,
    runs optional OCR scanning, and returns a secure file token and extracted fields.
    """
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded. Please select a receipt image or PDF.'}), 400

    uploaded_file = request.files['file']
    if not uploaded_file or not uploaded_file.filename:
        return jsonify({'error': 'Empty filename uploaded.'}), 400

    # Read bytes for size and validation
    file_bytes = uploaded_file.read()
    file_size = len(file_bytes)
    uploaded_file.seek(0)

    if file_size > MAX_FILE_SIZE_BYTES:
        return jsonify({'error': f'File exceeds 10MB limit ({round(file_size/(1024*1024), 1)}MB). Please upload a smaller file.'}), 400

    if file_size == 0:
        return jsonify({'error': 'Uploaded file is empty.'}), 400

    original_name = secure_filename(uploaded_file.filename) or "receipt"
    mimetype = uploaded_file.mimetype or 'application/octet-stream'

    allowed, ext_or_err = is_allowed_file(original_name, mimetype)
    if not allowed:
        return jsonify({'error': ext_or_err}), 400

    ext = ext_or_err
    unique_key = f"{uuid.uuid4().hex[:16]}_{int(time.time())}.{ext}"
    dest_path = UPLOAD_DIR / unique_key

    # Save to disk securely
    with open(dest_path, 'wb') as f:
        f.write(file_bytes)

    # Perform OCR if image
    ocr_applied, extracted, notice = perform_ai_ocr(file_bytes, mimetype, original_name)

    token = uuid.uuid4().hex
    TEMP_UPLOADS[token] = {
        'user_id': request.user_id,
        'unique_key': unique_key,
        'original_name': original_name,
        'file_size': file_size,
        'mime_type': mimetype,
        'ocr_applied': ocr_applied,
        'extracted_data': extracted,
        'created_at': time.time()
    }

    # Clean stale temp tokens (> 1 hour)
    now = time.time()
    stale_keys = [k for k, v in TEMP_UPLOADS.items() if now - v.get('created_at', 0) > 3600]
    for k in stale_keys:
        TEMP_UPLOADS.pop(k, None)

    return jsonify({
        'message': 'File uploaded and verified successfully.',
        'file_token': token,
        'file_name': original_name,
        'file_size': file_size,
        'mime_type': mimetype,
        'ocr_applied': ocr_applied,
        'extracted_data': extracted,
        'notice': notice
    }), 200


@receipts_bp.route('', methods=['POST'])
@require_auth
def create_receipt():
    """
    Creates a persistent receipt record. Supports both:
    1. Two-step submission (supplying file_token from /upload-scan)
    2. Single-step multipart submission (uploading file and form fields together)
    Optionally auto-creates a linked expense in the specified trip.
    """
    file_token = None
    file_bytes = None
    original_name = None
    mimetype = None
    file_size = 0
    unique_key = None
    ocr_applied = 0
    ocr_extracted_data = "{}"

    # Check if multipart with direct file or JSON with file_token
    if request.content_type and 'multipart/form-data' in request.content_type:
        form_data = request.form
        file_token = form_data.get('file_token')
        
        if file_token and file_token in TEMP_UPLOADS:
            cached = TEMP_UPLOADS.pop(file_token)
            if cached['user_id'] != request.user_id:
                return jsonify({'error': 'Unauthorized token access.'}), 403
            unique_key = cached['unique_key']
            original_name = cached['original_name']
            mimetype = cached['mime_type']
            file_size = cached['file_size']
            ocr_applied = 1 if cached.get('ocr_applied') else 0
            ocr_extracted_data = json.dumps(cached.get('extracted_data', {}))
        elif 'file' in request.files:
            up_file = request.files['file']
            if not up_file or not up_file.filename:
                return jsonify({'error': 'Please provide a valid receipt file.'}), 400
            
            file_bytes = up_file.read()
            file_size = len(file_bytes)
            if file_size > MAX_FILE_SIZE_BYTES:
                return jsonify({'error': 'File exceeds 10MB limit.'}), 400
            if file_size == 0:
                return jsonify({'error': 'Uploaded file is empty.'}), 400
            
            original_name = secure_filename(up_file.filename) or "receipt"
            mimetype = up_file.mimetype or 'application/octet-stream'
            allowed, ext_or_err = is_allowed_file(original_name, mimetype)
            if not allowed:
                return jsonify({'error': ext_or_err}), 400
            
            unique_key = f"{uuid.uuid4().hex[:16]}_{int(time.time())}.{ext_or_err}"
            with open(UPLOAD_DIR / unique_key, 'wb') as f:
                f.write(file_bytes)
                
            ocr_ok, extracted_res, _ = perform_ai_ocr(file_bytes, mimetype, original_name)
            ocr_applied = 1 if ocr_ok else 0
            ocr_extracted_data = json.dumps(extracted_res)
        else:
            return jsonify({'error': 'Missing receipt file or file_token.'}), 400
            
        data = form_data
    else:
        data = request.get_json() or {}
        file_token = data.get('file_token')
        if not file_token or file_token not in TEMP_UPLOADS:
            return jsonify({'error': 'Valid file_token is required. Please upload the receipt file first.'}), 400
            
        cached = TEMP_UPLOADS.pop(file_token)
        if cached['user_id'] != request.user_id:
            return jsonify({'error': 'Unauthorized file token.'}), 403
            
        unique_key = cached['unique_key']
        original_name = cached['original_name']
        mimetype = cached['mime_type']
        file_size = cached['file_size']
        ocr_applied = 1 if cached.get('ocr_applied') else 0
        ocr_extracted_data = json.dumps(cached.get('extracted_data', {}))

    # Parse and validate metadata fields
    title = (data.get('title') or original_name or 'Receipt').strip()
    merchant_name = (data.get('merchant_name') or '').strip()
    
    try:
        amount = float(data.get('amount') or 0.0)
    except (ValueError, TypeError):
        return jsonify({'error': 'Receipt amount must be a valid number.'}), 400

    if amount < 0:
        return jsonify({'error': 'Amount cannot be negative.'}), 400

    currency = (data.get('currency') or 'INR').strip().upper()
    date_str = (data.get('date') or datetime.now().strftime('%Y-%m-%d')).strip()
    category = (data.get('category') or 'other').strip().lower()
    if category not in VALID_CATEGORIES:
        category = 'other'

    payment_method = (data.get('payment_method') or 'credit_card').strip().lower()
    if payment_method not in VALID_PAYMENT_METHODS:
        payment_method = 'other'

    notes = (data.get('notes') or '').strip()
    trip_id = data.get('trip_id')
    create_expense = str(data.get('create_expense', '')).lower() in ('true', '1', 'yes')

    # Verify trip ownership if specified
    if trip_id:
        try:
            trip_id = int(trip_id)
            with get_db() as conn:
                trip = conn.execute("SELECT id FROM trips WHERE id = ? AND user_id = ?", (trip_id, request.user_id)).fetchone()
                if not trip:
                    return jsonify({'error': 'Specified trip not found or unauthorized.'}), 404
        except ValueError:
            trip_id = None
    else:
        trip_id = None

    expense_id = None
    is_expense_created = 0

    with get_db() as conn:
        # If user selected to automatically create linked expense
        if create_expense and trip_id:
            exp_res = conn.execute(
                """
                INSERT INTO expenses (trip_id, title, category, amount, currency, date, notes, receipt_filename, is_verified_price)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
                """,
                (trip_id, title or merchant_name or 'Receipt Expense', category, amount, currency, date_str, notes, original_name)
            )
            expense_id = exp_res.lastrowid
            is_expense_created = 1

        receipt_res = conn.execute(
            """
            INSERT INTO receipts (
                user_id, trip_id, expense_id, title, merchant_name, amount, currency,
                date, category, payment_method, notes, file_path, file_name, file_size,
                mime_type, ocr_applied, ocr_extracted_data, is_expense_created
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                request.user_id, trip_id, expense_id, title, merchant_name, amount, currency,
                date_str, category, payment_method, notes, unique_key, original_name, file_size,
                mimetype, ocr_applied, ocr_extracted_data, is_expense_created
            )
        )
        receipt_id = receipt_res.lastrowid

        # Update expense with reverse pointer if created
        if expense_id:
            conn.execute("UPDATE expenses SET receipt_id = ? WHERE id = ?", (receipt_id, expense_id))

    return jsonify({
        'message': 'Receipt saved to vault successfully.',
        'receipt_id': receipt_id,
        'linked_expense_id': expense_id,
        'is_expense_created': is_expense_created
    }), 201


@receipts_bp.route('', methods=['GET'])
@require_auth
def get_receipts():
    """
    Returns user's receipts with comprehensive filtering (trip, category, date, search)
    and summary financial metrics.
    """
    trip_id = request.args.get('trip_id')
    category = request.args.get('category')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    search = (request.args.get('search') or '').strip().lower()

    query = """
        SELECT r.*,
               t.title as trip_title,
               t.destination as trip_destination,
               e.id as linked_expense_id,
               e.amount as linked_expense_amount
        FROM receipts r
        LEFT JOIN trips t ON r.trip_id = t.id
        LEFT JOIN expenses e ON r.expense_id = e.id
        WHERE r.user_id = ?
    """
    params = [request.user_id]

    if trip_id:
        try:
            query += " AND r.trip_id = ?"
            params.append(int(trip_id))
        except ValueError:
            pass

    if category and category.lower() != 'all':
        query += " AND LOWER(r.category) = ?"
        params.append(category.lower())

    if start_date:
        query += " AND r.date >= ?"
        params.append(start_date)

    if end_date:
        query += " AND r.date <= ?"
        params.append(end_date)

    if search:
        query += " AND (LOWER(r.title) LIKE ? OR LOWER(r.merchant_name) LIKE ? OR LOWER(r.notes) LIKE ?)"
        term = f"%{search}%"
        params.extend([term, term, term])

    query += " ORDER BY r.date DESC, r.id DESC"

    with get_db() as conn:
        rows = conn.execute(query, tuple(params)).fetchall()

    receipts_list = []
    total_amount = 0.0
    cat_breakdown: Dict[str, float] = {c: 0.0 for c in VALID_CATEGORIES}
    linked_count = 0
    unlinked_count = 0
    currencies = set()

    for row in rows:
        r = dict(row)
        try:
            r['ocr_extracted_data'] = json.loads(r.get('ocr_extracted_data') or '{}')
        except Exception:
            r['ocr_extracted_data'] = {}

        # Provide secure file URL
        r['file_url'] = f"/api/receipts/{r['id']}/file"

        amt = r.get('amount') or 0.0
        total_amount += amt
        cat = (r.get('category') or 'other').lower()
        if cat in cat_breakdown:
            cat_breakdown[cat] += amt
        else:
            cat_breakdown['other'] += amt

        if r.get('is_expense_created') or r.get('expense_id'):
            linked_count += 1
        else:
            unlinked_count += 1

        if r.get('currency'):
            currencies.add(r['currency'])

        receipts_list.append(r)

    summary = {
        'total_amount': round(total_amount, 2),
        'total_count': len(receipts_list),
        'by_category': {k: round(v, 2) for k, v in cat_breakdown.items()},
        'linked_count': linked_count,
        'unlinked_count': unlinked_count,
        'currencies': sorted(list(currencies)) or ['INR']
    }

    return jsonify({
        'receipts': receipts_list,
        'summary': summary
    }), 200


@receipts_bp.route('/<int:receipt_id>', methods=['GET'])
@require_auth
def get_receipt_detail(receipt_id: int):
    """Returns detailed information for a single receipt owned by current user."""
    with get_db() as conn:
        row = conn.execute(
            """
            SELECT r.*,
                   t.title as trip_title,
                   t.destination as trip_destination,
                   e.id as linked_expense_id,
                   e.title as linked_expense_title,
                   e.amount as linked_expense_amount
            FROM receipts r
            LEFT JOIN trips t ON r.trip_id = t.id
            LEFT JOIN expenses e ON r.expense_id = e.id
            WHERE r.id = ? AND r.user_id = ?
            """,
            (receipt_id, request.user_id)
        ).fetchone()

        if not row:
            return jsonify({'error': 'Receipt not found or unauthorized.'}), 404

        r = dict(row)
        try:
            r['ocr_extracted_data'] = json.loads(r.get('ocr_extracted_data') or '{}')
        except Exception:
            r['ocr_extracted_data'] = {}
        r['file_url'] = f"/api/receipts/{r['id']}/file"

    return jsonify({'receipt': r}), 200


@receipts_bp.route('/<int:receipt_id>/file', methods=['GET'])
@require_auth
def download_receipt_file(receipt_id: int):
    """
    Secure file streaming endpoint.
    Strictly verifies ownership before streaming. Supports inline viewing or download.
    """
    with get_db() as conn:
        row = conn.execute(
            "SELECT file_path, file_name, mime_type FROM receipts WHERE id = ? AND user_id = ?",
            (receipt_id, request.user_id)
        ).fetchone()

        if not row:
            return jsonify({'error': 'Receipt file not found or unauthorized.'}), 404

        unique_key = row['file_path']
        original_name = row['file_name']
        mimetype = row['mime_type']

    target_file = UPLOAD_DIR / secure_filename(unique_key)
    if not target_file.exists():
        return jsonify({'error': 'Receipt file is missing from server storage.'}), 404

    as_attachment = request.args.get('download') == '1'

    response = send_file(
        target_file,
        mimetype=mimetype,
        as_attachment=as_attachment,
        download_name=original_name
    )
    # Add anti-sniff security header
    response.headers['X-Content-Type-Options'] = 'nosniff'
    return response


@receipts_bp.route('/<int:receipt_id>', methods=['PUT'])
@require_auth
def update_receipt(receipt_id: int):
    """Updates receipt metadata and optionally propagates changes to linked expense."""
    data = request.get_json() or {}

    with get_db() as conn:
        receipt = conn.execute(
            "SELECT * FROM receipts WHERE id = ? AND user_id = ?",
            (receipt_id, request.user_id)
        ).fetchone()

        if not receipt:
            return jsonify({'error': 'Receipt not found or unauthorized.'}), 404

        fields = []
        params = []

        if 'title' in data:
            fields.append("title = ?")
            params.append(data['title'].strip())

        if 'merchant_name' in data:
            fields.append("merchant_name = ?")
            params.append(data['merchant_name'].strip())

        if 'amount' in data:
            try:
                amt = float(data['amount'])
                if amt < 0:
                    return jsonify({'error': 'Amount cannot be negative.'}), 400
                fields.append("amount = ?")
                params.append(amt)
            except (ValueError, TypeError):
                return jsonify({'error': 'Invalid amount.'}), 400

        if 'currency' in data:
            fields.append("currency = ?")
            params.append(data['currency'].strip().upper())

        if 'date' in data:
            fields.append("date = ?")
            params.append(data['date'].strip())

        if 'category' in data:
            cat = data['category'].strip().lower()
            if cat in VALID_CATEGORIES:
                fields.append("category = ?")
                params.append(cat)

        if 'payment_method' in data:
            pm = data['payment_method'].strip().lower()
            if pm in VALID_PAYMENT_METHODS:
                fields.append("payment_method = ?")
                params.append(pm)

        if 'notes' in data:
            fields.append("notes = ?")
            params.append(data['notes'].strip())

        if 'trip_id' in data:
            t_id = data['trip_id']
            if t_id:
                try:
                    t_id = int(t_id)
                    t_chk = conn.execute("SELECT id FROM trips WHERE id = ? AND user_id = ?", (t_id, request.user_id)).fetchone()
                    if not t_chk:
                        return jsonify({'error': 'Selected trip not found.'}), 404
                    fields.append("trip_id = ?")
                    params.append(t_id)
                except ValueError:
                    pass
            else:
                fields.append("trip_id = NULL")

        fields.append("updated_at = CURRENT_TIMESTAMP")

        if fields:
            params.append(receipt_id)
            conn.execute(f"UPDATE receipts SET {', '.join(fields)} WHERE id = ?", tuple(params))

        # Check if linked expense should be synchronized
        sync_expense = data.get('sync_linked_expense', False)
        if sync_expense and receipt['expense_id']:
            exp_fields = []
            exp_params = []
            if 'title' in data:
                exp_fields.append("title = ?")
                exp_params.append(data['title'].strip())
            if 'amount' in data:
                exp_fields.append("amount = ?")
                exp_params.append(float(data['amount']))
            if 'category' in data:
                exp_fields.append("category = ?")
                exp_params.append(data['category'].strip().lower())
            if 'date' in data:
                exp_fields.append("date = ?")
                exp_params.append(data['date'].strip())
            if exp_fields:
                exp_params.append(receipt['expense_id'])
                conn.execute(f"UPDATE expenses SET {', '.join(exp_fields)} WHERE id = ?", tuple(exp_params))

    return jsonify({'message': 'Receipt updated successfully.'}), 200


@receipts_bp.route('/<int:receipt_id>', methods=['DELETE'])
@require_auth
def delete_receipt(receipt_id: int):
    """
    Deletes receipt record and physical file from server.
    Optionally deletes linked expense if user confirms with delete_linked_expense=1.
    """
    delete_linked_expense = request.args.get('delete_linked_expense') == '1'

    with get_db() as conn:
        receipt = conn.execute(
            "SELECT id, file_path, expense_id FROM receipts WHERE id = ? AND user_id = ?",
            (receipt_id, request.user_id)
        ).fetchone()

        if not receipt:
            return jsonify({'error': 'Receipt not found or unauthorized.'}), 404

        # Delete or unlink expense
        if receipt['expense_id']:
            if delete_linked_expense:
                conn.execute("DELETE FROM expenses WHERE id = ?", (receipt['expense_id'],))
            else:
                conn.execute("UPDATE expenses SET receipt_id = NULL WHERE id = ?", (receipt['expense_id'],))

        # Delete receipt record
        conn.execute("DELETE FROM receipts WHERE id = ?", (receipt_id,))

    # Remove physical file safely
    try:
        f_path = UPLOAD_DIR / secure_filename(receipt['file_path'])
        if f_path.exists():
            f_path.unlink()
    except Exception as e:
        print(f"[Receipts] Error removing file {receipt['file_path']}: {e}")

    return jsonify({'message': 'Receipt deleted successfully.'}), 200


@receipts_bp.route('/<int:receipt_id>/convert-to-expense', methods=['POST'])
@require_auth
def convert_to_expense(receipt_id: int):
    """
    Converts an unlinked receipt into an expense without retyping information.
    Prevents duplicates if an expense is already linked.
    """
    data = request.get_json() or {}

    with get_db() as conn:
        receipt = conn.execute(
            """
            SELECT r.*, e.id as existing_expense_id
            FROM receipts r
            LEFT JOIN expenses e ON r.expense_id = e.id
            WHERE r.id = ? AND r.user_id = ?
            """,
            (receipt_id, request.user_id)
        ).fetchone()

        if not receipt:
            return jsonify({'error': 'Receipt not found or unauthorized.'}), 404

        if receipt['existing_expense_id']:
            return jsonify({
                'error': f"Receipt is already linked to Expense #{receipt['existing_expense_id']}. Duplicate expense prevented."
            }), 400

        # Determine target trip
        target_trip_id = data.get('trip_id') or receipt['trip_id']
        if not target_trip_id:
            return jsonify({'error': 'Please select a trip to associate this expense with.'}), 400

        try:
            target_trip_id = int(target_trip_id)
            trip = conn.execute("SELECT id, title FROM trips WHERE id = ? AND user_id = ?", (target_trip_id, request.user_id)).fetchone()
            if not trip:
                return jsonify({'error': 'Selected trip not found or unauthorized.'}), 404
        except ValueError:
            return jsonify({'error': 'Invalid trip ID.'}), 400

        title = (data.get('title') or receipt['title'] or receipt['merchant_name'] or 'Receipt Expense').strip()
        amount = float(data.get('amount') if data.get('amount') is not None else receipt['amount'])
        category = (data.get('category') or receipt['category'] or 'other').strip().lower()
        date_str = (data.get('date') or receipt['date'] or datetime.now().strftime('%Y-%m-%d')).strip()
        notes = (data.get('notes') if data.get('notes') is not None else receipt['notes'] or '').strip()
        payer_name = (data.get('payer_name') or 'You').strip()

        # Insert new expense
        exp_res = conn.execute(
            """
            INSERT INTO expenses (trip_id, title, category, amount, currency, date, notes, receipt_filename, is_verified_price, receipt_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
            """,
            (target_trip_id, title, category, amount, receipt['currency'], date_str, notes, receipt['file_name'], receipt_id)
        )
        new_expense_id = exp_res.lastrowid

        # Update receipt record with foreign key link
        conn.execute(
            """
            UPDATE receipts
            SET trip_id = ?, expense_id = ?, is_expense_created = 1, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """,
            (target_trip_id, new_expense_id, receipt_id)
        )

    return jsonify({
        'message': f"Receipt successfully converted to Expense #{new_expense_id}.",
        'expense_id': new_expense_id,
        'trip_id': target_trip_id
    }), 201


@receipts_bp.route('/export', methods=['GET'])
@require_auth
def export_receipts_csv():
    """Generates and downloads a clean CSV export of the user's receipts."""
    trip_id = request.args.get('trip_id')
    category = request.args.get('category')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    query = """
        SELECT r.id, r.title, r.merchant_name, r.amount, r.currency, r.date,
               r.category, r.payment_method, t.title as trip_title,
               r.expense_id, r.file_name, r.created_at, r.notes
        FROM receipts r
        LEFT JOIN trips t ON r.trip_id = t.id
        WHERE r.user_id = ?
    """
    params = [request.user_id]

    if trip_id:
        try:
            query += " AND r.trip_id = ?"
            params.append(int(trip_id))
        except ValueError:
            pass

    if category and category.lower() != 'all':
        query += " AND LOWER(r.category) = ?"
        params.append(category.lower())

    if start_date:
        query += " AND r.date >= ?"
        params.append(start_date)

    if end_date:
        query += " AND r.date <= ?"
        params.append(end_date)

    query += " ORDER BY r.date DESC, r.id DESC"

    with get_db() as conn:
        rows = conn.execute(query, tuple(params)).fetchall()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        'Receipt ID', 'Title', 'Merchant Name', 'Amount', 'Currency', 'Purchase Date',
        'Category', 'Payment Method', 'Trip', 'Linked Expense ID', 'Original Filename',
        'Logged At', 'Notes'
    ])

    for row in rows:
        writer.writerow([
            row['id'],
            row['title'],
            row['merchant_name'] or '',
            row['amount'],
            row['currency'],
            row['date'],
            (row['category'] or '').capitalize(),
            (row['payment_method'] or '').replace('_', ' ').title(),
            row['trip_title'] or 'None (Unassigned)',
            row['expense_id'] or 'Not Linked',
            row['file_name'],
            row['created_at'],
            row['notes'] or ''
        ])

    csv_data = output.getvalue()
    filename = f"TravelWise_Receipts_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"

    return Response(
        csv_data,
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
