import random
import datetime
from fastapi import APIRouter, Depends, HTTPException, Body, BackgroundTasks
from sqlalchemy.orm import Session

from database import get_db
from models import User, Budget
from schemas import UserCreate, UserLogin, UserVerify, UserResetRequest, UserResetSubmit
from auth_utils import verify_password, get_password_hash, create_access_token
from email_utils import send_otp_email

router = APIRouter(tags=["auth"])

@router.post("/api/auth/signup")
def signup(user_data: UserCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    email_clean = user_data.email.lower().strip()
    if not user_data.name.strip() or len(user_data.password) < 4:
        raise HTTPException(status_code=400, detail="Name and password (min 4 chars) are required")
        
    existing = db.query(User).filter(User.email == email_clean).first()
    if existing:
        raise HTTPException(status_code=400, detail="Account already exists. Please sign in.")

    # Generate initials
    parts = user_data.name.strip().split()
    initials = "".join([p[0] for p in parts[:2]]).upper() if parts else "FI"

    # Simulate registration and send code (like the frontend does)
    verification_code = f"{random.randint(100000, 999999)}"
    print(f"🔑 [OTP Generated] Signup OTP for {email_clean}: {verification_code}")
    expires = datetime.datetime.utcnow() + datetime.timedelta(minutes=10)

    user = User(
        email=email_clean,
        name=user_data.name.strip(),
        phone=user_data.phone,
        password_hash=get_password_hash(user_data.password),
        verified=False,
        verification_code=verification_code,
        verification_expires=expires,
        premium=False
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    budgets = [
        Budget(user_id=user.id, category="Food & Dining", budget_amount=15000),
        Budget(user_id=user.id, category="Shopping", budget_amount=8000),
        Budget(user_id=user.id, category="Transport", budget_amount=6000),
        Budget(user_id=user.id, category="Entertainment", budget_amount=4000),
        Budget(user_id=user.id, category="Home & Bills", budget_amount=20000)
    ]
    db.add_all(budgets)
    db.commit()

    # Send OTP email in background — API responds instantly, email is sent concurrently
    background_tasks.add_task(
        send_otp_email,
        to_email=user.email,
        recipient_name=user.name,
        otp=verification_code,
        purpose="signup"
    )

    return {
        "message": "Account created. Check your inbox for the code.",
        "user": {
            "email": user.email,
            "name": user.name,
            "initials": initials,
            "verified": False,
            "premium": False
        }
    }

@router.post("/api/auth/signin")
def signin(login_data: UserLogin, db: Session = Depends(get_db)):
    email_clean = login_data.email.lower().strip()
    user = db.query(User).filter(User.email == email_clean).first()
    if not user:
        raise HTTPException(status_code=400, detail="No account found for this email. Please sign up.")
    
    if not verify_password(login_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect password")

    # Generate initials
    parts = user.name.split()
    initials = "".join([p[0] for p in parts[:2]]).upper() if parts else "FI"

    access_token = create_access_token(data={"sub": user.email})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "phone": user.phone,
            "initials": initials,
            "verified": user.verified,
            "premium": user.premium
        }
    }

@router.post("/api/auth/verify")
def verify_email(verify_data: UserVerify, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == verify_data.email.lower()).first()
    if not user:
        raise HTTPException(status_code=404, detail="No account found")
    
    if user.verified:
        return {"message": "Already verified", "verified": True}

    if not user.verification_code or user.verification_code != verify_data.code.strip():
        raise HTTPException(status_code=400, detail="Invalid verification code")
        
    if user.verification_expires and datetime.datetime.utcnow() > user.verification_expires:
        raise HTTPException(status_code=400, detail="Code expired. Please resend.")

    user.verified = True
    user.verification_code = None
    user.verification_expires = None
    db.commit()

    parts = user.name.split()
    initials = "".join([p[0] for p in parts[:2]]).upper() if parts else "FI"

    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "phone": user.phone,
        "initials": initials,
        "verified": True,
        "premium": user.premium
    }

@router.post("/api/auth/resend")
def resend_code(background_tasks: BackgroundTasks, payload: dict = Body(...), db: Session = Depends(get_db)):
    email = payload.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    user = db.query(User).filter(User.email == email.lower()).first()
    if not user:
        raise HTTPException(status_code=404, detail="No account found")

    code = f"{random.randint(100000, 999999)}"
    print(f"🔑 [OTP Generated] Resend OTP for {user.email}: {code}")
    user.verification_code = code
    user.verification_expires = datetime.datetime.utcnow() + datetime.timedelta(minutes=10)
    db.commit()

    # Send OTP email in background — API responds instantly
    background_tasks.add_task(
        send_otp_email,
        to_email=user.email,
        recipient_name=user.name,
        otp=code,
        purpose="resend"
    )

    return {"message": "Verification code resent"}

@router.post("/api/auth/request-reset")
def request_reset(reset_data: UserResetRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == reset_data.email.lower()).first()
    if not user:
        raise HTTPException(status_code=404, detail="No account found for this email")

    code = f"{random.randint(100000, 999999)}"
    print(f"🔑 [OTP Generated] Reset Password OTP for {user.email}: {code}")
    user.reset_code = code
    user.reset_expires = datetime.datetime.utcnow() + datetime.timedelta(minutes=15)
    db.commit()

    # Send reset code email in background — API responds instantly
    background_tasks.add_task(
        send_otp_email,
        to_email=user.email,
        recipient_name=user.name,
        otp=code,
        purpose="reset"
    )

    return {"message": "Reset code sent"}

@router.post("/api/auth/reset")
def reset_password_endpoint(reset_data: UserResetSubmit, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == reset_data.email.lower()).first()
    if not user:
        raise HTTPException(status_code=404, detail="No account found")

    if not user.reset_code or user.reset_code != reset_data.code.strip():
        raise HTTPException(status_code=400, detail="Invalid reset code")

    if user.reset_expires and datetime.datetime.utcnow() > user.reset_expires:
        raise HTTPException(status_code=400, detail="Reset code expired. Please request a new one.")

    if len(reset_data.new_password) < 4:
        raise HTTPException(status_code=400, detail="Password must be at least 4 characters")

    user.password_hash = get_password_hash(reset_data.new_password)
    user.reset_code = None
    user.reset_expires = None
    user.verified = True  # Verified email proof
    db.commit()

    parts = user.name.split()
    initials = "".join([p[0] for p in parts[:2]]).upper() if parts else "FI"

    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "phone": user.phone,
        "initials": initials,
        "verified": True,
        "premium": user.premium
    }
