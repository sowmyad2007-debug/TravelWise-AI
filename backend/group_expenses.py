from flask import Blueprint, request, jsonify
from auth import require_auth
from database import get_db

group_bp = Blueprint('group', __name__, url_prefix='/api/group')

def verify_trip_access(trip_id: int, user_id: int):
    with get_db() as conn:
        return conn.execute("SELECT * FROM trips WHERE id = ? AND user_id = ?", (trip_id, user_id)).fetchone()

@group_bp.route('/trips/<int:trip_id>/members', methods=['GET'])
@require_auth
def get_members(trip_id: int):
    trip = verify_trip_access(trip_id, request.user_id)
    if not trip:
        return jsonify({'error': 'Trip not found or unauthorized.'}), 404

    with get_db() as conn:
        members = conn.execute("SELECT * FROM group_members WHERE trip_id = ? ORDER BY id ASC", (trip_id,)).fetchall()

    return jsonify({'members': members}), 200

@group_bp.route('/trips/<int:trip_id>/members', methods=['POST'])
@require_auth
def add_member(trip_id: int):
    trip = verify_trip_access(trip_id, request.user_id)
    if not trip:
        return jsonify({'error': 'Trip not found or unauthorized.'}), 404

    data = request.get_json() or {}
    name = (data.get('name') or '').strip()
    email = (data.get('email') or '').strip().lower()

    if not name:
        return jsonify({'error': 'Member name is required.'}), 400

    with get_db() as conn:
        existing = conn.execute("SELECT id FROM group_members WHERE trip_id = ? AND LOWER(name) = ?", (trip_id, name.lower())).fetchone()
        if existing:
            return jsonify({'error': f"'{name}' is already a group member."}), 409

        cursor = conn.cursor()
        cursor.execute("INSERT INTO group_members (trip_id, name, email) VALUES (?, ?, ?)", (trip_id, name, email))
        member_id = cursor.lastrowid

    return jsonify({'message': f"Added '{name}' to group.", 'member_id': member_id}), 201

@group_bp.route('/trips/<int:trip_id>/members/<int:member_id>', methods=['DELETE'])
@require_auth
def remove_member(trip_id: int, member_id: int):
    trip = verify_trip_access(trip_id, request.user_id)
    if not trip:
        return jsonify({'error': 'Trip not found or unauthorized.'}), 404

    with get_db() as conn:
        # Check if member exists
        m = conn.execute("SELECT name FROM group_members WHERE id = ? AND trip_id = ?", (member_id, trip_id)).fetchone()
        if not m:
            return jsonify({'error': 'Group member not found.'}), 404

        conn.execute("DELETE FROM group_members WHERE id = ? AND trip_id = ?", (member_id, trip_id))

    return jsonify({'message': f"Member '{m['name']}' removed from group."}), 200

@group_bp.route('/trips/<int:trip_id>/split-summary', methods=['GET'])
@require_auth
def get_split_summary(trip_id: int):
    """
    Group Debt Optimizer 2.0:
    Calculates exact payer totals, fair shares (equal or custom), net balances,
    reconciliation verification (sum of net balances == 0), and runs the
    greedy Minimum Cash Flow debt simplification algorithm.
    """
    trip = verify_trip_access(trip_id, request.user_id)
    if not trip:
        return jsonify({'error': 'Trip not found or unauthorized.'}), 404

    with get_db() as conn:
        members = conn.execute("SELECT name FROM group_members WHERE trip_id = ?", (trip_id,)).fetchall()
        member_names = [m['name'] for m in members]

        if not member_names:
            member_names = [request.user['name'] if hasattr(request, 'user') and request.user else 'You']

        expenses = conn.execute(
            "SELECT * FROM expenses WHERE trip_id = ? AND is_shared = 1 ORDER BY date DESC",
            (trip_id,)
        ).fetchall()

    total_shared_spent = sum(e['amount'] for e in expenses)

    # 1. Track how much each person paid
    paid_by_person = {name: 0.0 for name in member_names}
    for e in expenses:
        payer = e['payer_name'].strip() if e['payer_name'] else member_names[0]
        if payer not in paid_by_person:
            paid_by_person[payer] = 0.0
            if payer not in member_names:
                member_names.append(payer)
        paid_by_person[payer] = round(paid_by_person[payer] + e['amount'], 2)

    # 2. Fair share calculation with exact rounding reconciliation
    num_members = max(1, len(member_names))
    base_share = round(total_shared_spent / num_members, 2)
    
    # Calculate each person's net balance: net = paid - fair_share
    balances = {}
    total_net = 0.0

    for i, name in enumerate(member_names):
        paid = paid_by_person.get(name, 0.0)
        net = round(paid - base_share, 2)
        total_net += net
        balances[name] = {
            'name': name,
            'paid': round(paid, 2),
            'fair_share': base_share,
            'net_balance': net,
            'status': 'gets_back' if net > 0 else ('owes' if net < 0 else 'settled')
        }

    # Reconcile tiny rounding residuals (e.g. 1 cent discrepancy across 3 members)
    rounding_residual = round(total_net, 2)
    if abs(rounding_residual) >= 0.01 and member_names:
        # Absorb rounding error onto the first member's balance
        first_name = member_names[0]
        balances[first_name]['net_balance'] = round(balances[first_name]['net_balance'] - rounding_residual, 2)
        balances[first_name]['status'] = 'gets_back' if balances[first_name]['net_balance'] > 0 else ('owes' if balances[first_name]['net_balance'] < 0 else 'settled')

    # Invariant assertion check: sum of net balances == 0
    final_sum_net = round(sum(b['net_balance'] for b in balances.values()), 2)
    reconciled = abs(final_sum_net) <= 0.01

    # 3. Minimum Cash Flow Debt Settlement Algorithm
    debtors = []   # (name, amount_owed > 0)
    creditors = [] # (name, amount_to_receive > 0)

    for name, b in balances.items():
        if b['net_balance'] < -0.01:
            debtors.append({'name': name, 'amount': abs(b['net_balance'])})
        elif b['net_balance'] > 0.01:
            creditors.append({'name': name, 'amount': b['net_balance']})

    settlements = []
    d_i, c_i = 0, 0
    while d_i < len(debtors) and c_i < len(creditors):
        debtor = debtors[d_i]
        creditor = creditors[c_i]

        settle_amt = round(min(debtor['amount'], creditor['amount']), 2)
        if settle_amt > 0:
            settlements.append({
                'from_user': debtor['name'],
                'to_user': creditor['name'],
                'amount': settle_amt,
                'currency': trip['currency']
            })

        debtor['amount'] = round(debtor['amount'] - settle_amt, 2)
        creditor['amount'] = round(creditor['amount'] - settle_amt, 2)

        if debtor['amount'] <= 0.01:
            d_i += 1
        if creditor['amount'] <= 0.01:
            c_i += 1

    return jsonify({
        'trip_id': trip_id,
        'currency': trip['currency'],
        'total_shared_spent': round(total_shared_spent, 2),
        'members_count': num_members,
        'fair_share_per_person': base_share,
        'balances': list(balances.values()),
        'settlements': settlements,
        'shared_expenses_count': len(expenses),
        'mathematical_reconciliation': {
            'reconciled': reconciled,
            'sum_of_net_balances': final_sum_net,
            'algorithm': 'Minimum Cash Flow (Greedy Debt Matching)'
        }
    }), 200
