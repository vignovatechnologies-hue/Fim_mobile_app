import datetime
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from database import get_db
from models import Transaction, Budget, User
from schemas import TransactionCreate, TransactionResponse, BudgetCategoryResponse
from dependencies import get_current_user

router = APIRouter(tags=["transactions"])

BUDGET_COLORS = {
    "Food & Dining":   "bg-amber-100 text-amber-700",
    "Shopping":        "bg-rose-100 text-rose-700",
    "Transport":       "bg-sky-100 text-sky-700",
    "Entertainment":   "bg-violet-100 text-violet-700",
    "Home & Bills":    "bg-emerald-100 text-emerald-700",
}

CAT_MAP = {
    "Food":          "Food & Dining",
    "Shopping":      "Shopping",
    "Transport":     "Transport",
    "Entertainment": "Entertainment",
    "Home":          "Home & Bills",
    "Income":        "Income",
    "Savings":       "Savings",
}


def _serialize_txn(txn) -> dict:
    return TransactionResponse.from_orm_model(txn).model_dump()   # outputs {id, name, cat, amount, when}


# ── GET all transactions ───────────────────────────────────────────────────────
@router.get("/api/transactions")
def get_transactions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    txns = (
        db.query(Transaction)
        .filter(Transaction.user_id == current_user.id)
        .order_by(Transaction.when.desc())
        .limit(100)
        .all()
    )
    return JSONResponse([_serialize_txn(t) for t in txns])


# ── ADD a transaction (expense / income) ──────────────────────────────────────
@router.post("/api/transactions")
def add_transaction(
    txn_data: TransactionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    std_cat = CAT_MAP.get(txn_data.category, txn_data.category)
    amount = txn_data.amount
    # Expenses must be stored as negative
    if std_cat not in ("Income", "Savings") and amount > 0:
        amount = -amount

    txn = Transaction(
        user_id=current_user.id,
        name=txn_data.name.strip(),
        category=std_cat,
        amount=amount,
        payment_status="credit" if amount > 0 else "debit",
        when=datetime.datetime.utcnow(),
    )
    db.add(txn)
    db.commit()
    db.refresh(txn)
    return JSONResponse(_serialize_txn(txn))


# ── GET budgets with real spent amounts ───────────────────────────────────────
@router.get("/api/budgets")
def get_budgets(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    budgets = db.query(Budget).filter(Budget.user_id == current_user.id).all()

    now = datetime.datetime.utcnow()
    start_of_month = datetime.datetime(now.year, now.month, 1)

    result = []
    for b in budgets:
        spent = (
            db.query(Transaction)
            .filter(
                Transaction.user_id == current_user.id,
                Transaction.category == b.category,
                Transaction.when >= start_of_month,
                Transaction.amount < 0,
            )
            .all()
        )
        total_spent = sum(abs(t.amount) for t in spent)
        result.append({
            "name":   b.category,
            "spent":  round(total_spent, 2),
            "budget": round(b.budget_amount, 2),
            "color":  BUDGET_COLORS.get(b.category, "bg-gray-100 text-gray-700"),
        })

    return JSONResponse(result)
