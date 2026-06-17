import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from database import get_db
from models import Loan, Transaction, User
from schemas import LoanCreate, LoanResponse
from dependencies import get_current_user

router = APIRouter(tags=["loans"])

LOAN_LOGOS = {
    "Home": "🏠", "Personal": "💳",
    "Auto": "🚗", "Education": "🎓", "Consumer": "📱",
}


def _serialize(loan: Loan) -> dict:
    """Convert ORM Loan → dict using Python field names (paid, left, due) for frontend."""
    return LoanResponse.from_orm_model(loan).model_dump()


def _mark_paid(loan: Loan, db: Session, user_id: int):
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


# ── GET all loans ─────────────────────────────────────────────────────────────
@router.get("/api/loans")
def get_loans(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    loans = db.query(Loan).filter(Loan.user_id == current_user.id).order_by(Loan.due_day).all()
    return JSONResponse([_serialize(l) for l in loans])


# ── ADD a new loan ─────────────────────────────────────────────────────────────
@router.post("/api/loans")
def add_loan(
    loan_data: LoanCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    logo = LOAN_LOGOS.get(loan_data.type, "💼")
    loan = Loan(
        user_id=current_user.id,
        name=loan_data.name.strip(),
        type=loan_data.type,
        emi=loan_data.emi,
        left_amount=loan_data.emi * 24,   # default 24-month tenure
        total_tenure=24,
        paid_tenure=0,
        rate=loan_data.rate,
        due_day=loan_data.due_day or 15,
        logo=logo,
        paid_this_month=False,
    )
    db.add(loan)
    db.commit()
    db.refresh(loan)
    return JSONResponse(_serialize(loan))


# ── PAY ALL unpaid loans (direct, no Razorpay — called from payments route) ───
# NOTE: This route MUST be defined before /{loan_id}/pay to avoid routing conflict
@router.post("/api/loans/pay-all")
def pay_all_loans(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    unpaid = db.query(Loan).filter(
        Loan.user_id == current_user.id,
        Loan.paid_this_month == False,
    ).all()
    for loan in unpaid:
        _mark_paid(loan, db, current_user.id)
    db.commit()
    loans = db.query(Loan).filter(Loan.user_id == current_user.id).order_by(Loan.due_day).all()
    return JSONResponse([_serialize(l) for l in loans])


# ── RESET monthly cycle ───────────────────────────────────────────────────────
@router.post("/api/loans/reset-cycle")
def reset_monthly_cycle(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Mark all loans as unpaid. Call at the start of each new billing month."""
    db.query(Loan).filter(Loan.user_id == current_user.id).update({"paid_this_month": False})
    db.commit()
    loans = db.query(Loan).filter(Loan.user_id == current_user.id).order_by(Loan.due_day).all()
    return JSONResponse([_serialize(l) for l in loans])


# ── PAY a single loan ─────────────────────────────────────────────────────────
@router.post("/api/loans/{loan_id}/pay")
def pay_loan(
    loan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    loan = db.query(Loan).filter(Loan.id == loan_id, Loan.user_id == current_user.id).first()
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    if not loan.paid_this_month:
        _mark_paid(loan, db, current_user.id)
        db.commit()
        db.refresh(loan)
    return JSONResponse(_serialize(loan))
