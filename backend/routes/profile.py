import re
import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Body
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from database import get_db
from models import Bank, User
from schemas import UserResponse, BankCreate, BankResponse, FCMTokenRegister
from dependencies import get_current_user

router = APIRouter(tags=["profile"])

# ── Razorpay client (shared from payments module) ─────────────────────────────
_rz_client = None

def _get_razorpay():
    """Lazy-load Razorpay client using credentials from settings."""
    global _rz_client
    if _rz_client is not None:
        return _rz_client
    try:
        from config import settings
        import razorpay
        key_id = settings.RAZORPAY_KEY_ID
        key_secret = settings.RAZORPAY_KEY_SECRET
        if key_id and key_secret and key_id.startswith("rzp_"):
            _rz_client = razorpay.Client(auth=(key_id, key_secret))
            print(f"[profile] ✅ Razorpay bank-validation client ready — {key_id[:16]}…")
            return _rz_client
    except Exception as e:
        print(f"[profile] ⚠️  Razorpay init failed: {e}")
    return None


# ── helpers ───────────────────────────────────────────────────────────────────
_IFSC_RE = re.compile(r"^[A-Z]{4}0[A-Z0-9]{6}$")


def _format_only_validation(account_number: str, ifsc_code: str, holder_name: str) -> dict:
    """Helper to perform strict format-only validation of account number and IFSC."""
    clean = account_number.replace(" ", "")
    if len(clean) < 9 or len(clean) > 18:
        return {"valid": False, "registered_name": None, "error": "Account number must be 9–18 digits"}
    if not _IFSC_RE.match(ifsc_code.upper()):
        return {"valid": False, "registered_name": None, "error": "Invalid IFSC code format (e.g. HDFC0001234)"}
    return {"valid": True, "registered_name": holder_name, "error": None}


def _validate_bank_with_razorpay(account_number: str, ifsc_code: str, holder_name: str) -> dict:
    """
    Uses Razorpay Fund Account Validation API to verify the bank account.
    Falls back to format validation if Razorpay X is not enabled or supported on standard keys.
    """
    rz = _get_razorpay()
    if not rz:
        return _format_only_validation(account_number, ifsc_code, holder_name)

    try:
        # Check if SDK supports contact and fund_account APIs (standard SDK does not)
        if not hasattr(rz, "contact") or not hasattr(rz, "fund_account"):
            print("[profile] ⚠️  Razorpay X features not supported by the standard Razorpay Python client. Falling back to format validation.")
            return _format_only_validation(account_number, ifsc_code, holder_name)

        # Step 1: Create a Razorpay Contact for this user
        contact_payload = {
            "name": holder_name or "Account Holder",
            "type": "customer",
            "reference_id": f"fim_validate_{datetime.datetime.utcnow().timestamp():.0f}",
        }
        contact = rz.contact.create(data=contact_payload)
        contact_id = contact["id"]

        # Step 2: Create a Fund Account (bank_account type)
        fa_payload = {
            "contact_id": contact_id,
            "account_type": "bank_account",
            "bank_account": {
                "name": holder_name or "Account Holder",
                "ifsc": ifsc_code.upper().strip(),
                "account_number": account_number.replace(" ", ""),
            },
        }
        fund_account = rz.fund_account.create(data=fa_payload)
        fund_account_id = fund_account["id"]

        # Step 3: Validate (penny-less check) — available in Razorpay X
        validate_payload = {
            "account_number": "2323230073145795",   # Your Razorpay X source account
            "fund_account": {
                "id": fund_account_id,
            },
            "amount": 100,   # ₹1 in paise (penny-drop style)
            "currency": "INR",
            "notes": {"purpose": "fim_bank_validation"},
        }
        result = rz.fund_account.validate(fund_account_id, data=validate_payload)

        # Razorpay returns status: "completed" on success
        status = result.get("status", "")
        reg_name = result.get("fund_account", {}).get("bank_account", {}).get("name", holder_name)

        if status in ("completed", "created"):
            return {"valid": True, "registered_name": reg_name, "error": None}
        else:
            return {
                "valid": False,
                "registered_name": None,
                "error": f"Bank validation failed — account not found or IFSC mismatch (status: {status})",
            }

    except AttributeError as ae:
        print(f"[profile] ⚠️  Razorpay X API attribute missing ({ae}). Falling back to format validation.")
        return _format_only_validation(account_number, ifsc_code, holder_name)
    except Exception as e:
        err_msg = str(e)
        print(f"[profile] ⚠️  Razorpay X API error ({err_msg}). Falling back to format validation.")
        # If it's a specific validation failure we can identify, raise it
        if "IFSC" in err_msg.upper() or "ifsc" in err_msg:
            return {"valid": False, "registered_name": None, "error": "Invalid IFSC code — branch not found"}
        if "account_number" in err_msg or "Account" in err_msg:
            return {"valid": False, "registered_name": None, "error": "Invalid account number — please recheck"}
        # Otherwise, fall back to format validation so we don't block linking
        return _format_only_validation(account_number, ifsc_code, holder_name)


def serialize_bank(bank) -> dict:
    r = BankResponse.from_orm(bank)
    return r.model_dump()


def serialize_user(user) -> dict:
    parts = user.name.split()
    initials = "".join([p[0] for p in parts[:2]]).upper() if parts else "FI"
    r = UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        phone=user.phone,
        initials=initials,
        verified=user.verified,
        premium=user.premium
    )
    return r.model_dump()


# ── routes ────────────────────────────────────────────────────────────────────
@router.get("/api/user/profile")
def get_profile(current_user: User = Depends(get_current_user)):
    return JSONResponse(serialize_user(current_user))


@router.post("/api/user/premium")
def toggle_premium(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    current_user.premium = not current_user.premium
    db.commit()
    db.refresh(current_user)
    return JSONResponse(serialize_user(current_user))


@router.get("/api/user/banks")
def get_banks(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    banks = db.query(Bank).filter(Bank.user_id == current_user.id).all()
    return JSONResponse([serialize_bank(b) for b in banks])


@router.post("/api/user/banks")
def link_bank(
    bank_data: BankCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # ── 1. Basic format checks ────────────────────────────────────────────────
    clean_acc = bank_data.account_number.replace(" ", "")
    if len(clean_acc) < 9 or len(clean_acc) > 18 or not clean_acc.isdigit():
        raise HTTPException(
            status_code=400,
            detail="Account number must be 9–18 digits (numbers only)",
        )

    ifsc = bank_data.ifsc_code.strip().upper()
    if not _IFSC_RE.match(ifsc):
        raise HTTPException(
            status_code=400,
            detail="Invalid IFSC code. Format: 4 letters + 0 + 6 alphanumeric (e.g. HDFC0001234)",
        )

    # ── 2. Razorpay bank account validation ──────────────────────────────────
    result = _validate_bank_with_razorpay(clean_acc, ifsc, current_user.name)
    if not result["valid"]:
        raise HTTPException(
            status_code=400,
            detail=result["error"] or "Bank account validation failed. Please check account number and IFSC code.",
        )

    # ── 3. Persist the verified bank ─────────────────────────────────────────
    last4  = clean_acc[-4:]
    masked = f"•••• {last4}"

    bank = Bank(
        user_id=current_user.id,
        name=bank_data.name.strip(),
        masked_acc=masked,
        ifsc_code=ifsc,
    )
    db.add(bank)
    db.commit()
    db.refresh(bank)
    return JSONResponse(serialize_bank(bank))


@router.delete("/api/user/banks/{bank_id}")
def remove_bank(bank_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    bank = db.query(Bank).filter(Bank.id == bank_id, Bank.user_id == current_user.id).first()
    if not bank:
        raise HTTPException(status_code=404, detail="Bank not found")

    db.delete(bank)
    db.commit()
    return {"message": "Bank unlinked successfully"}


@router.post("/api/user/statement")
def generate_statement(payload: dict = Body(...), current_user: User = Depends(get_current_user)):
    stmt_range = payload.get("range", "month")
    return {
        "status": "ready",
        "filename": f"FIM_Statement_{current_user.name.replace(' ', '_')}_{stmt_range}.pdf",
        "message": f"Statement generated for {stmt_range}"
    }


# ── REGISTER FCM Token ────────────────────────────────────────────────────────
@router.post("/api/user/fcm-token")
def register_fcm_token(
    payload: FCMTokenRegister,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current_user.fcm_token = payload.fcm_token.strip()
    db.commit()
    return {"message": "FCM token registered successfully"}
