import uuid
import hmac
import hashlib
import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Body, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from database import get_db
from models import User, Loan, Transaction
from dependencies import get_current_user
from config import settings

router = APIRouter(tags=["payments"])

# ── Razorpay client (only created when real credentials are present) ──────────
_razorpay_client = None
_razorpay_key_id: Optional[str] = None

def _init_razorpay():
    global _razorpay_client, _razorpay_key_id
    key_id     = settings.RAZORPAY_KEY_ID
    key_secret = settings.RAZORPAY_KEY_SECRET
    if key_id and key_secret and key_id.startswith("rzp_"):
        try:
            import razorpay
            _razorpay_client = razorpay.Client(auth=(key_id, key_secret))
            _razorpay_key_id = key_id
            mode = "TEST" if "test" in key_id else "LIVE"
            print(f"[payments] ✅ Razorpay {mode} client ready — key {key_id[:16]}…")
        except ImportError:
            print("[payments] ❌ 'razorpay' package not installed. Run: pip install razorpay")
        except Exception as e:
            print(f"[payments] ❌ Razorpay init failed: {e}")
    else:
        print("[payments] ⚠️  No valid Razorpay credentials — running in MOCK mode.")

_init_razorpay()

# ── helpers ───────────────────────────────────────────────────────────────────
def _mark_loans_paid(db: Session, user_id: int, loan_ids: list[int]) -> list[str]:
    """Mark loans as paid, deduct EMI from outstanding, log transaction. Returns names."""
    paid_names = []
    for lid in loan_ids:
        loan = db.query(Loan).filter(Loan.id == lid, Loan.user_id == user_id).first()
        if loan and not loan.paid_this_month:
            loan.paid_this_month = True
            loan.paid_tenure = min(loan.total_tenure, loan.paid_tenure + 1)
            loan.left_amount = max(0.0, loan.left_amount - loan.emi)
            db.add(Transaction(
                user_id=user_id,
                name=f"EMI — {loan.name}",
                category="Home & Bills",
                amount=-loan.emi,
                payment_status="debit",
                when=datetime.datetime.utcnow(),
            ))
            paid_names.append(loan.name)
    db.commit()
    return paid_names


# ── routes ────────────────────────────────────────────────────────────────────
@router.post("/api/payments/create-order")
def create_payment_order(
    payload: dict = Body(...),
    current_user: User = Depends(get_current_user),
):
    amount = payload.get("amount")
    loan_ids: list[int] = payload.get("loan_ids", [])  # pass from frontend so notes are complete

    if not amount or float(amount) <= 0:
        raise HTTPException(status_code=400, detail="Valid amount is required")

    if _razorpay_client:
        # ── LIVE / TEST mode ──────────────────────────────────────────────────
        try:
            order = _razorpay_client.order.create(data={
                "amount": int(float(amount) * 100),   # paise
                "currency": "INR",
                "receipt": f"fim_{current_user.id}_{uuid.uuid4().hex[:8]}",
                "payment_capture": 1,
                "notes": {
                    "user_id":  str(current_user.id),
                    "loan_ids": ",".join(str(i) for i in loan_ids),
                },
            })
            return {
                "order_id": order["id"],
                "key_id": _razorpay_key_id,
                "amount": float(amount),
                "is_mock": False,
            }
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Razorpay error: {e}")
    else:
        # ── MOCK mode ─────────────────────────────────────────────────────────
        mock_order_id = f"order_mock_{uuid.uuid4().hex[:14]}"
        return {
            "order_id": mock_order_id,
            "key_id": None,          # frontend checks for null → skip SDK
            "amount": float(amount),
            "is_mock": True,
        }


@router.post("/api/payments/verify-signature")
def verify_payment_signature(
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    loan_ids: list[int] = payload.get("loan_ids", [])
    amount   = payload.get("amount", 0)
    is_mock  = payload.get("is_mock", True)

    if not is_mock and _razorpay_client:
        # ── cryptographic verification for live/test payments ─────────────────
        try:
            _razorpay_client.utility.verify_payment_signature({
                "razorpay_order_id":   payload.get("razorpay_order_id", ""),
                "razorpay_payment_id": payload.get("razorpay_payment_id", ""),
                "razorpay_signature":  payload.get("razorpay_signature", ""),
            })
        except Exception:
            raise HTTPException(status_code=400, detail="Payment signature invalid — possible fraud.")

    paid_names = _mark_loans_paid(db, current_user.id, loan_ids)

    return {
        "status": "success",
        "message": f"₹{amount:,.0f} payment processed successfully",
        "loans_paid": paid_names,
        "mode": "mock" if is_mock else "live",
    }


@router.post("/api/payments/reset-cycle")
def reset_monthly_cycle(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Reset all loans to unpaid (new billing month). Call from frontend at month-start."""
    db.query(Loan).filter(Loan.user_id == current_user.id).update({"paid_this_month": False})
    db.commit()
    return {"status": "reset", "message": "All loans reset to unpaid for new billing cycle."}


# ── Razorpay Webhook ──────────────────────────────────────────────────────────
@router.post("/api/payments/webhook")
async def razorpay_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Razorpay sends signed POST events here.

    Set this URL in your Razorpay Dashboard → Settings → Webhooks:
        https://<your-ngrok-or-domain>/api/payments/webhook

    Events handled:
      • payment.captured  → mark loans paid (metadata carries loan_ids & user_id)
      • payment.failed    → log the failure (no side-effects on loans)
    """
    # ── 1. Read raw body (needed for HMAC check) ──────────────────────────────
    raw_body = await request.body()

    # ── 2. Verify Razorpay webhook signature ──────────────────────────────────
    webhook_secret = getattr(settings, "RAZORPAY_WEBHOOK_SECRET", None)
    if webhook_secret:
        received_sig = request.headers.get("X-Razorpay-Signature", "")
        expected_sig = hmac.new(
            webhook_secret.encode("utf-8"),
            raw_body,
            hashlib.sha256,
        ).hexdigest()
        if not hmac.compare_digest(expected_sig, received_sig):
            raise HTTPException(status_code=400, detail="Webhook signature mismatch — rejected")
    else:
        print("[webhook] ⚠️  RAZORPAY_WEBHOOK_SECRET not set — skipping signature check (unsafe for production!)")

    # ── 3. Parse event payload ────────────────────────────────────────────────
    import json
    try:
        event = json.loads(raw_body)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    event_type = event.get("event", "")
    print(f"[webhook] Received event: {event_type}")

    # ── 4. Handle payment.captured ────────────────────────────────────────────
    if event_type == "payment.captured":
        payment = event.get("payload", {}).get("payment", {}).get("entity", {})
        payment_id  = payment.get("id", "")
        order_id    = payment.get("order_id", "")
        amount_paise = payment.get("amount", 0)
        notes = payment.get("notes", {})

        # We embed user_id and loan_ids in the order notes at create-order time
        # Notes format: {"user_id": "42", "loan_ids": "1,2,3"}
        user_id_str  = notes.get("user_id", "")
        loan_ids_str = notes.get("loan_ids", "")

        print(f"[webhook] payment.captured — payment_id={payment_id} order={order_id} "
              f"amount=₹{amount_paise/100:.2f} user={user_id_str} loans={loan_ids_str}")

        if user_id_str and loan_ids_str:
            try:
                user_id  = int(user_id_str)
                loan_ids = [int(x) for x in loan_ids_str.split(",") if x.strip()]
                paid = _mark_loans_paid(db, user_id, loan_ids)
                print(f"[webhook] ✅ Marked paid via webhook: {paid}")
            except Exception as ex:
                print(f"[webhook] ⚠️  Could not mark loans paid: {ex}")
        else:
            print("[webhook] ℹ️  No loan_ids/user_id in notes — skipping auto-mark")

        return JSONResponse({"status": "ok", "event": event_type, "payment_id": payment_id})

    # ── 5. Handle payment.failed ──────────────────────────────────────────────
    elif event_type == "payment.failed":
        payment = event.get("payload", {}).get("payment", {}).get("entity", {})
        payment_id = payment.get("id", "")
        error_desc = payment.get("error_description", "Unknown error")
        print(f"[webhook] ❌ payment.failed — id={payment_id} reason={error_desc}")
        return JSONResponse({"status": "ok", "event": event_type, "payment_id": payment_id})

    # ── 6. Acknowledge all other events silently ──────────────────────────────
    else:
        print(f"[webhook] ℹ️  Unhandled event type: {event_type}")
        return JSONResponse({"status": "ok", "event": event_type, "note": "event received but not processed"})
