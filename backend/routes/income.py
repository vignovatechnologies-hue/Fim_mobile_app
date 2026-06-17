import datetime
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session

from database import get_db
from models import Transaction, User
from dependencies import get_current_user

router = APIRouter(tags=["income"])

@router.get("/api/income")
def get_income_sources(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    txns = db.query(Transaction).filter(
        Transaction.user_id == current_user.id,
        Transaction.category == "Income",
        Transaction.amount > 0
    ).order_by(Transaction.when.desc()).all()
    
    colors = {
        "Salary": "bg-emerald-100 text-emerald-700",
        "Freelance": "bg-sky-100 text-sky-700",
        "Investment": "bg-violet-100 text-violet-700",
        "Rental": "bg-amber-100 text-amber-700"
    }

    sources = []
    for t in txns:
        src_type = "Salary"
        if "freelance" in t.name.lower() or "acme" in t.name.lower():
            src_type = "Freelance"
        elif "dividend" in t.name.lower() or "invest" in t.name.lower():
            src_type = "Investment"
        elif "rental" in t.name.lower() or "tenant" in t.name.lower() or "2bhk" in t.name.lower():
            src_type = "Rental"
            
        sources.append({
            "id": t.id,
            "name": t.name,
            "type": src_type,
            "amount": t.amount,
            "when": t.when.strftime("%d %b") if (datetime.datetime.utcnow() - t.when).days > 1 else "Monthly",
            "color": colors.get(src_type, "bg-emerald-100 text-emerald-700")
        })
    return sources

@router.post("/api/income")
def add_income(payload: dict = Body(...), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    name = payload.get("name")
    amount = payload.get("amount")
    src_type = payload.get("type", "Salary")
    
    if not name or not amount:
        raise HTTPException(status_code=400, detail="Name and amount are required")
        
    txn = Transaction(
        user_id=current_user.id,
        name=name.strip(),
        category="Income",
        amount=float(amount),
        payment_status="credit",
        when=datetime.datetime.utcnow()
    )
    db.add(txn)
    db.commit()
    db.refresh(txn)
    
    colors = {
        "Salary": "bg-emerald-100 text-emerald-700",
        "Freelance": "bg-sky-100 text-sky-700",
        "Investment": "bg-violet-100 text-violet-700",
        "Rental": "bg-amber-100 text-amber-700"
    }

    return {
        "id": txn.id,
        "name": txn.name,
        "type": src_type,
        "amount": txn.amount,
        "when": "Just now",
        "color": colors.get(src_type, "bg-emerald-100 text-emerald-700")
    }
