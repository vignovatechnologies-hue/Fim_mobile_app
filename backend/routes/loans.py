import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from database import get_db
from models import Loan, Transaction, User
from schemas import LoanCreate, LoanResponse, LoanUpdate
from dependencies import get_current_user
from reminders import check_and_send_reminders

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
    
    # Calculate total tenure from start/end dates if provided, default to 24
    total_tenure = loan_data.total_tenure or 24
    if loan_data.start_date and loan_data.end_date and not loan_data.total_tenure:
        diff_months = (loan_data.end_date.year - loan_data.start_date.year) * 12 + (loan_data.end_date.month - loan_data.start_date.month)
        total_tenure = max(1, diff_months)
        
    left_amount = loan_data.left_amount
    if left_amount is None:
        left_amount = loan_data.original_amount if loan_data.original_amount is not None else (loan_data.emi * total_tenure)
    paid_tenure = loan_data.paid_tenure or 0
        
    loan = Loan(
        user_id=current_user.id,
        name=loan_data.name.strip(),
        type=loan_data.type,
        emi=loan_data.emi,
        left_amount=left_amount,
        original_amount=loan_data.original_amount,
        total_tenure=total_tenure,
        paid_tenure=paid_tenure,
        rate=loan_data.rate,
        due_day=loan_data.due_day or 15,
        logo=logo,
        paid_this_month=False,
        start_date=loan_data.start_date,
        end_date=loan_data.end_date,
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


# ── EDIT a loan ─────────────────────────────────────────────────────────────
@router.put("/api/loans/{loan_id}")
def update_loan(
    loan_id: int,
    loan_data: LoanUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    loan = db.query(Loan).filter(Loan.id == loan_id, Loan.user_id == current_user.id).first()
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
        
    if loan_data.name is not None:
        loan.name = loan_data.name.strip()
    if loan_data.type is not None:
        loan.type = loan_data.type
        loan.logo = LOAN_LOGOS.get(loan_data.type, "💼")
    if loan_data.emi is not None:
        loan.emi = loan_data.emi
    if loan_data.rate is not None:
        loan.rate = loan_data.rate
    if loan_data.due_day is not None:
        loan.due_day = loan_data.due_day
    if loan_data.original_amount is not None:
        loan.original_amount = loan_data.original_amount
    if loan_data.start_date is not None:
        loan.start_date = loan_data.start_date
    if loan_data.end_date is not None:
        loan.end_date = loan_data.end_date
        
    # Re-calculate tenure and left amount if start/end dates are provided/updated
    if loan.start_date and loan.end_date:
        diff_months = (loan.end_date.year - loan.start_date.year) * 12 + (loan.end_date.month - loan.start_date.month)
        loan.total_tenure = max(1, diff_months)
        
    if loan_data.left_amount is not None:
        loan.left_amount = loan_data.left_amount
    if loan_data.total_tenure is not None:
        loan.total_tenure = loan_data.total_tenure
    if loan_data.paid_tenure is not None:
        loan.paid_tenure = loan_data.paid_tenure
        
    db.commit()
    db.refresh(loan)
    return JSONResponse(_serialize(loan))


# ── DELETE a loan ───────────────────────────────────────────────────────────
@router.delete("/api/loans/{loan_id}")
def delete_loan(
    loan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    loan = db.query(Loan).filter(Loan.id == loan_id, Loan.user_id == current_user.id).first()
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
        
    db.delete(loan)
    db.commit()
    return JSONResponse({"message": "Loan deleted successfully", "id": loan_id})


# ── TRIGGER reminders ────────────────────────────────────────────────────────
@router.post("/api/loans/send-reminders")
def trigger_reminders(db: Session = Depends(get_db)):
    """Manually trigger email & SMS reminders check."""
    result = check_and_send_reminders(db)
    return JSONResponse(result)
