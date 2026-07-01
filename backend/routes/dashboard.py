import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import Transaction, Loan, SavingsGoal, User
from schemas import DashboardSummary
from dependencies import get_current_user

router = APIRouter(tags=["dashboard"])

@router.get("/api/dashboard/summary", response_model=DashboardSummary)
def get_dashboard_summary(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    now = datetime.datetime.utcnow()
    start_of_month = datetime.datetime(now.year, now.month, 1)

    income_txns = db.query(Transaction).filter(
        Transaction.user_id == current_user.id,
        Transaction.category == "Income",
        Transaction.amount > 0,
        Transaction.when >= start_of_month
    ).all()
    income = sum([t.amount for t in income_txns])

    spent_txns = db.query(Transaction).filter(
        Transaction.user_id == current_user.id,
        Transaction.amount < 0,
        Transaction.when >= start_of_month
    ).all()
    spent = sum([abs(t.amount) for t in spent_txns])

    all_income = sum([t.amount for t in db.query(Transaction).filter(
        Transaction.user_id == current_user.id,
        Transaction.category == "Income",
        Transaction.amount > 0
    ).all()])

    all_spent = sum([abs(t.amount) for t in db.query(Transaction).filter(
        Transaction.user_id == current_user.id,
        Transaction.amount < 0
    ).all()])

    net_balance = all_income - all_spent

    loans = db.query(Loan).filter(Loan.user_id == current_user.id).all()
    active_loans_count = len(loans)
    outstanding_loans_amount = sum([l.left_amount for l in loans])

    next_emi_days = "—"
    next_emi_name = "No upcoming EMIs"
    unpaid_loans = [l for l in loans if not l.paid_this_month]
    if unpaid_loans:
        unpaid_loans.sort(key=lambda x: x.due_day)
        next_loan = unpaid_loans[0]
        days_left = next_loan.due_day - now.day
        if days_left < 0:
            import calendar
            days_in_month = calendar.monthrange(now.year, now.month)[1]
            days_left = (days_in_month - now.day) + next_loan.due_day
            
        next_emi_days = f"{days_left}d"
        next_emi_name = next_loan.name

    goals = db.query(SavingsGoal).filter(SavingsGoal.user_id == current_user.id).all()
    total_target = sum([g.target_amount for g in goals])
    total_saved = sum([g.saved_amount for g in goals])
    
    savings_goal_percent = 0.0
    if total_target > 0:
        savings_goal_percent = round((total_saved / total_target) * 100)
        
    savings_goal_text = f"₹ {round(total_saved/1000)}k of {round(total_target/1000)}k"
    if total_saved >= 100000:
        savings_goal_text = f"₹ {round(total_saved/100000, 1)}L of {round(total_target/100000, 1)}L"

    health_score = 75
    if income > 0:
        spend_ratio = spent / income
        if spend_ratio < 0.5:
            health_score += 10
        elif spend_ratio > 0.8:
            health_score -= 10
            
        total_monthly_emi = sum([l.emi for l in loans])
        debt_ratio = total_monthly_emi / income
        if debt_ratio > 0.4:
            health_score -= 10
        elif debt_ratio < 0.2:
            health_score += 5
            
    health_score = max(10, min(100, health_score))

    return DashboardSummary(
        net_balance=net_balance,
        income=income,
        spent=spent,
        active_loans_count=active_loans_count,
        outstanding_loans_amount=outstanding_loans_amount,
        health_score=health_score,
        savings_goal_percent=savings_goal_percent,
        savings_goal_text=savings_goal_text,
        next_emi_days=next_emi_days,
        next_emi_name=next_emi_name
    )
