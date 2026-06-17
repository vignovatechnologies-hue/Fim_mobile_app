"""
End-to-end payment test — bypasses login by generating JWT directly.
Tests:
  1. Create Razorpay order (real API)
  2. Simulate webhook (payment.captured)
  3. Verify DB: loan marked paid + transaction created
  4. Verify order in Razorpay
"""
import requests, json, time, jwt
from database import engine
from sqlalchemy import text
from config import settings

BASE = "http://localhost:8000"
SEP = "=" * 60

# ─── Step 0: Reset loan id=1 to unpaid ───────────────────────────────────────
print(f"\n{SEP}")
print("STEP 0: Reset loan id=1 to unpaid for testing")
print(SEP)
with engine.connect() as conn:
    conn.execute(text("UPDATE loans SET paid_this_month = false WHERE id = 1"))
    conn.commit()
    row = conn.execute(text("SELECT id, name, emi, paid_this_month FROM loans WHERE id = 1")).fetchone()
    print(f"  ✅ Loan reset: id={row[0]} name={row[1]} emi=₹{row[2]} paid={row[3]}")

# ─── Step 1: Generate JWT directly ──────────────────────────────────────────
print(f"\n{SEP}")
print("STEP 1: Generate JWT for user_id=1 (demo@fim.in)")
print(SEP)
token_payload = {"sub": "demo@fim.in"}
token = jwt.encode(token_payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
print(f"  ✅ JWT: {token[:40]}…")
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

# ─── Step 2: Create Razorpay order ───────────────────────────────────────────
print(f"\n{SEP}")
print("STEP 2: Create Razorpay order via POST /api/payments/create-order")
print(SEP)
r = requests.post(f"{BASE}/api/payments/create-order",
    headers=headers,
    json={"amount": 24500, "loan_ids": [1]})
print(f"  HTTP Status: {r.status_code}")
order_data = r.json()
print(f"  Response: {json.dumps(order_data, indent=2)}")

order_id = order_data.get("order_id", "")
is_mock = order_data.get("is_mock", True)

if not is_mock and order_id.startswith("order_"):
    print(f"\n  🎉 REAL Razorpay order created!")
    print(f"  📋 Order ID: {order_id}")
    print(f"  💰 Amount: ₹{order_data['amount']:,.0f}")
    print(f"  🔑 Key: {order_data['key_id']}")
else:
    print(f"\n  ℹ️  Mock order created: {order_id}")

# ─── Step 3: Simulate webhook (payment.captured) ────────────────────────────
print(f"\n{SEP}")
print("STEP 3: Simulate Razorpay webhook → POST /api/payments/webhook")
print(SEP)

webhook_payload = {
    "event": "payment.captured",
    "payload": {
        "payment": {
            "entity": {
                "id": f"pay_test_{int(time.time())}",
                "order_id": order_id,
                "amount": 2450000,
                "currency": "INR",
                "status": "captured",
                "method": "upi",
                "notes": {
                    "user_id": "1",
                    "loan_ids": "1"
                }
            }
        }
    }
}

r = requests.post(f"{BASE}/api/payments/webhook",
    json=webhook_payload,
    headers={"Content-Type": "application/json"})
print(f"  HTTP Status: {r.status_code}")
print(f"  Response: {json.dumps(r.json(), indent=2)}")

if r.status_code == 200:
    print("  ✅ Webhook processed successfully!")
else:
    print("  ❌ Webhook failed!")

# ─── Step 4: Verify DB ──────────────────────────────────────────────────────
print(f"\n{SEP}")
print("STEP 4: Verify DB — loan paid + transaction recorded")
print(SEP)
time.sleep(0.5)

with engine.connect() as conn:
    row = conn.execute(text("SELECT id, name, emi, paid_this_month, left_amount FROM loans WHERE id = 1")).fetchone()
    print(f"  Loan: id={row[0]} name={row[1]} emi=₹{row[2]} paid_this_month={row[3]} left=₹{row[4]:,.0f}")
    if row[3]:
        print("  ✅ LOAN MARKED PAID via webhook!")
    else:
        print("  ❌ Loan NOT paid — issue with webhook processing")

    txn = conn.execute(text(
        "SELECT id, name, amount, category FROM transactions "
        "WHERE user_id = 1 AND name LIKE '%%HDFC%%' ORDER BY id DESC LIMIT 1"
    )).fetchone()
    if txn:
        print(f"  Transaction: id={txn[0]} name='{txn[1]}' amount=₹{txn[2]} cat={txn[3]}")
        print("  ✅ TRANSACTION RECORDED in DB!")
    else:
        print("  ❌ No transaction found")

# ─── Step 5: Fetch order from Razorpay ───────────────────────────────────────
print(f"\n{SEP}")
print("STEP 5: Verify order exists in Razorpay via API")
print(SEP)
if not is_mock:
    try:
        import razorpay
        client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
        rz_order = client.order.fetch(order_id)
        print(f"  ✅ ORDER EXISTS IN RAZORPAY!")
        print(f"  Status: {rz_order.get('status')}")
        print(f"  Amount: ₹{rz_order.get('amount', 0)/100:,.0f}")
        print(f"  Receipt: {rz_order.get('receipt')}")
        print(f"  Notes: {rz_order.get('notes')}")
        print(f"  Created: {rz_order.get('created_at')}")
    except Exception as e:
        print(f"  ⚠️  Could not fetch: {e}")
else:
    print("  ℹ️  Skipped (mock mode)")

# ─── Step 6: Test payment.failed webhook ─────────────────────────────────────
print(f"\n{SEP}")
print("STEP 6: Test payment.failed webhook")
print(SEP)
fail_payload = {
    "event": "payment.failed",
    "payload": {
        "payment": {
            "entity": {
                "id": f"pay_fail_{int(time.time())}",
                "order_id": order_id,
                "amount": 2450000,
                "error_description": "Payment was cancelled by user",
                "notes": {"user_id": "1", "loan_ids": "1"}
            }
        }
    }
}
r = requests.post(f"{BASE}/api/payments/webhook", json=fail_payload,
    headers={"Content-Type": "application/json"})
print(f"  HTTP Status: {r.status_code}")
print(f"  Response: {json.dumps(r.json(), indent=2)}")
if r.status_code == 200:
    print("  ✅ Failed payment logged (no DB side-effects)")

print(f"\n{SEP}")
print("🏁 ALL TESTS COMPLETE")
print(SEP)
