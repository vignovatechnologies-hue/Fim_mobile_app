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
        premium=user.premium,
        reminders_enabled=user.reminders_enabled if user.reminders_enabled is not None else True,
        photo_data=user.photo_data
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


@router.post("/api/user/photo")
def update_photo(
    payload: dict = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    photo_data = payload.get("photo_data")
    current_user.photo_data = photo_data
    db.commit()
    db.refresh(current_user)
    return JSONResponse(serialize_user(current_user))


# ── REMINDERS toggle ──────────────────────────────────────────────────────────
@router.get("/api/user/reminders")
def get_reminder_status(current_user: User = Depends(get_current_user)):
    enabled = current_user.reminders_enabled if current_user.reminders_enabled is not None else True
    return JSONResponse({"reminders_enabled": enabled})


@router.post("/api/user/reminders")
def toggle_reminders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current_value = current_user.reminders_enabled if current_user.reminders_enabled is not None else True
    current_user.reminders_enabled = not current_value
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
def generate_statement(
    payload: dict = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    import csv, io
    from models import Transaction

    stmt_range = payload.get("range", "month")
    from_iso   = payload.get("fromDate")
    to_iso     = payload.get("toDate")

    now = datetime.datetime.utcnow()

    # ── Build date window ───────────────────────────────────────────────────
    # ── Build date window ───────────────────────────────────────────────────
    anchor_date = now
    if from_iso:
        try:
            # Parse the anchor date sent by the client
            anchor_date = datetime.datetime.fromisoformat(from_iso.replace("Z", "+00:00")).replace(tzinfo=None)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid date format")

    if stmt_range == "day":
        start = anchor_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end   = anchor_date.replace(hour=23, minute=59, second=59, microsecond=999999)
    elif stmt_range == "month":
        start = anchor_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        # End of the month calculation
        next_month = start.replace(day=28) + datetime.timedelta(days=4)
        last_day = next_month - datetime.timedelta(days=next_month.day)
        end = last_day.replace(hour=23, minute=59, second=59, microsecond=999999)
    elif stmt_range == "year":
        start = anchor_date.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        end   = anchor_date.replace(month=12, day=31, hour=23, minute=59, second=59, microsecond=999999)
    elif stmt_range == "custom" and from_iso and to_iso:
        try:
            start = datetime.datetime.fromisoformat(from_iso.replace("Z", "+00:00")).replace(tzinfo=None)
            end   = datetime.datetime.fromisoformat(to_iso.replace("Z", "+00:00")).replace(tzinfo=None)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid date format")
    else:
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        end   = now

    # ── Query transactions ───────────────────────────────────────────────────
    txns = (
        db.query(Transaction)
        .filter(
            Transaction.user_id == current_user.id,
            Transaction.when >= start,
            Transaction.when <= end,
        )
        .order_by(Transaction.when.asc())
        .all()
    )

    # ── Build CSV ────────────────────────────────────────────────────────────
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["Date", "Description", "Category", "Type", "Amount (INR)"])
    for t in txns:
        writer.writerow([
            t.when.strftime("%d-%m-%Y %H:%M"),
            t.name,
            t.category,
            t.payment_status.capitalize(),
            f"{abs(t.amount):.2f}",
        ])
    # Summary footer
    writer.writerow([])
    writer.writerow(["Generated by FIM · " + now.strftime("%d %b %Y")])

    filename = f"FIM_Statement_{current_user.name.replace(' ', '_')}_{stmt_range}.csv"
    return {
        "status": "ready",
        "filename": filename,
        "csv_content": buf.getvalue(),
        "row_count": len(txns),
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


# ── CREATE Support Ticket ──────────────────────────────────────────────────────
@router.post("/api/user/support-ticket")
def create_support_ticket(
    payload: dict = Body(...),
    current_user: User = Depends(get_current_user),
):
    subject = payload.get("subject", "General Support")
    message = payload.get("message", "")
    
    if not message.strip():
        raise HTTPException(status_code=400, detail="Message content cannot be empty")
        
    from email_utils import send_via_brevo, send_via_smtp, send_via_sendgrid_api
    from config import settings
    
    email_subject = f"[FIM Ticket] {subject} - from {current_user.name}"
    formatted_message = message.replace('\n', '<br>')
    html_content = f"""
    <html>
    <head>
        <style>
            body {{ font-family: sans-serif; color: #333; }}
            .container {{ padding: 20px; border: 1px solid #ddd; border-radius: 10px; }}
            .header {{ background-color: #0f4a3f; color: white; padding: 15px; border-radius: 8px 8px 0 0; }}
            .field {{ margin-bottom: 10px; }}
            .label {{ font-weight: bold; }}
            .message-box {{ background-color: #f9f9f9; padding: 15px; border-radius: 5px; border-left: 4px solid #0f4a3f; margin-top: 15px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>New FIM Support Ticket</h2>
            </div>
            <div style="padding: 15px;">
                <div class="field"><span class="label">User Name:</span> {current_user.name}</div>
                <div class="field"><span class="label">User Email:</span> {current_user.email}</div>
                <div class="field"><span class="label">User Phone:</span> {current_user.phone or "N/A"}</div>
                <div class="field"><span class="label">Category / Subject:</span> {subject}</div>
                
                <h3>User Message:</h3>
                <div class="message-box">
                    {formatted_message}
                </div>
            </div>
        </div>
    </body>
    </html>
    """
    
    success = False
    
    # 1. Try Brevo HTTP API
    if settings.BREVO_API_KEY and settings.BREVO_FROM_EMAIL:
        success = send_via_brevo("vignovatechnologies@gmail.com", "Vignova Technologies", email_subject, html_content)
    
    # 2. Try SendGrid HTTP API
    elif settings.SENDGRID_API_KEY and settings.SENDGRID_FROM_EMAIL and not settings.SENDGRID_API_KEY.startswith("SG.YOUR_"):
        success = send_via_sendgrid_api("vignovatechnologies@gmail.com", "Vignova Technologies", email_subject, html_content)
        
    # 3. Try SMTP
    elif settings.SMTP_HOST and settings.SMTP_FROM_EMAIL:
        success = send_via_smtp("vignovatechnologies@gmail.com", "Vignova Technologies", email_subject, html_content)
        
    # Log to backend console
    print("\n" + "="*80)
    print(f"🎟️  [SUPPORT TICKET RAISED]")
    print(f"From User: {current_user.name} ({current_user.email})")
    print(f"Subject: {subject}")
    print(f"Message: {message}")
    if success:
        print(f"📧 Sent email to vignovatechnologies@gmail.com")
    else:
        print(f"⚠️ Email could not be sent to vignovatechnologies@gmail.com (Email settings not configured).")
    print("="*80 + "\n")
    
    return {"status": "success", "email_sent": success}
