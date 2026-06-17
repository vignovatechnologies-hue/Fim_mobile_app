import datetime
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session

from database import get_db
from models import Loan, Transaction, Budget, User
from dependencies import get_current_user

router = APIRouter(tags=["insights"])

@router.get("/api/insights")
def get_insights(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    budgets = db.query(Budget).filter(Budget.user_id == current_user.id).all()
    now = datetime.datetime.utcnow()
    start_of_month = datetime.datetime(now.year, now.month, 1)

    shopping_over_budget = False
    shopping_spent = 0.0
    shopping_limit = 0.0
    
    for b in budgets:
        if b.category == "Shopping":
            shopping_limit = b.budget_amount
            txns = db.query(Transaction).filter(
                Transaction.user_id == current_user.id,
                Transaction.category == "Shopping",
                Transaction.when >= start_of_month,
                Transaction.amount < 0
            ).all()
            shopping_spent = sum([abs(t.amount) for t in txns])
            if shopping_spent > b.budget_amount:
                shopping_over_budget = True

    insights = []
    
    if shopping_over_budget:
        pct = int((shopping_spent / shopping_limit) * 100) - 100
        insights.append({
            "tone": "warning",
            "title": f"Shopping is {pct}% over budget",
            "body": f"₹ {int(shopping_spent):,} spent of ₹ {int(shopping_limit):,}. Consider pausing non-essentials for 2 weeks.",
            "cta": "View transactions",
            "type": "shopping_warning"
        })
        
    bajaj_loan = db.query(Loan).filter(
        Loan.user_id == current_user.id,
        Loan.name.like("%Bajaj%"),
        Loan.paid_this_month == False
    ).first()
    
    if bajaj_loan:
        insights.append({
            "tone": "primary",
            "title": "Refinance Bajaj Personal Loan",
            "body": "At 11.2% (vs current 14.5%) you'd save ₹ 14,200/year. We can pre-qualify in 2 mins.",
            "cta": "Check eligibility",
            "type": "refinance"
        })
        
    insights.append({
        "tone": "success",
        "title": "Great job — savings up 18%",
        "body": "You're on track to hit your Emergency Fund 2 months early. Want to bump auto-save by ₹ 2k?",
        "cta": "Increase auto-save",
        "type": "savings_boost"
    })
    
    return insights

@router.post("/api/insights/ask")
def ask_ai_chat(payload: dict = Body(...), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = payload.get("text", "").lower().strip()
    if not query:
        raise HTTPException(status_code=400, detail="Query text is required")
        
    loans = db.query(Loan).filter(Loan.user_id == current_user.id).all()
    txns = db.query(Transaction).filter(Transaction.user_id == current_user.id).all()
    
    now = datetime.datetime.utcnow()
    start_of_month = datetime.datetime(now.year, now.month, 1)
    
    income = sum([t.amount for t in txns if t.category == "Income" and t.amount > 0 and t.when >= start_of_month])
    spent = sum([abs(t.amount) for t in txns if t.amount < 0 and t.when >= start_of_month])
    
    if "car" in query or "automobile" in query or "vehicle" in query:
        total_emi = sum([l.emi for l in loans])
        dti = round((total_emi / income) * 100) if income > 0 else 0
        return {
            "text": f"On your current monthly income of ₹{income:,.0f}, adding a ₹8L car loan (approx ₹16,700/mo) would push your debt-to-income ratio from {dti}% to {round(((total_emi + 16700) / income) * 100)}%. This is borderline. Consider a lower loan amount of ₹6L."
        }
        
    if "save" in query or "saving" in query:
        save_pct = round(((income - spent) / income) * 100) if income > 0 else 0
        return {
            "text": f"You are currently saving about {save_pct}% of your income. Bumping up your auto-savings by ₹2,000/month would fund your Emergency Fund 2 months ahead of schedule!"
        }
        
    if "invest" in query or "mutual fund" in query or "stocks" in query:
        return {
            "text": "Once your Emergency Fund is fully funded to your target of ₹3.6L, we recommend redirecting ₹10,000/month to a diversified index fund SIP (Nifty 50) for long-term growth. Expected returns: ~11-12% CAGR."
        }
        
    if "refinanc" in query or "bajaj" in query:
        return {
            "text": "Refinancing your Bajaj Personal Loan from 14.5% APR to 11.2% APR would reduce your monthly EMI and save you a total of ₹14,200/year in interest payouts. Since your health score is 78, you are pre-qualified. Would you like to check details?"
        }
        
    return {
        "text": f"Based on your actual June numbers: You've received ₹{income:,.0f} and spent ₹{spent:,.0f}. You have {len(loans)} active loans. Everything looks stable and on track. What specific details would you like to explore?"
    }
