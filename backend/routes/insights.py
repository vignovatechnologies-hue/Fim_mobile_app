import datetime
import logging
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session

from database import get_db
from models import Loan, Transaction, Budget, User
from dependencies import get_current_user
from config import settings

logger = logging.getLogger(__name__)

router = APIRouter(tags=["insights"])

# ---------------------------------------------------------------------------
# Helper: Build Gemini client lazily (only when first used)
# ---------------------------------------------------------------------------
_gemini_client = None

def _get_gemini_client():
    global _gemini_client
    if _gemini_client is None:
        try:
            from google import genai
            api_key = settings.GEMINI_API_KEY
            if not api_key:
                raise ValueError("GEMINI_API_KEY is not set in the environment.")
            _gemini_client = genai.Client(api_key=api_key)
        except Exception as e:
            logger.error(f"Failed to initialise Gemini client: {e}")
            raise
    return _gemini_client


# ---------------------------------------------------------------------------
# Helper: Build a rich financial context string from the user's real DB data
# ---------------------------------------------------------------------------
def _build_financial_context(user: User, db: Session) -> str:
    now = datetime.datetime.utcnow()
    start_of_month = datetime.datetime(now.year, now.month, 1)

    loans = db.query(Loan).filter(Loan.user_id == user.id).all()
    txns = db.query(Transaction).filter(Transaction.user_id == user.id).all()
    budgets = db.query(Budget).filter(Budget.user_id == user.id).all()

    # Monthly income & spending
    monthly_income = sum(t.amount for t in txns if t.amount > 0 and t.when >= start_of_month and t.category == "Income")
    monthly_spent = sum(abs(t.amount) for t in txns if t.amount < 0 and t.when >= start_of_month)
    monthly_savings = monthly_income - monthly_spent

    # Category breakdown
    category_spend: dict[str, float] = {}
    for t in txns:
        if t.amount < 0 and t.when >= start_of_month:
            category_spend[t.category] = category_spend.get(t.category, 0) + abs(t.amount)

    cat_lines = "\n".join(
        f"  - {cat}: ₹{amt:,.0f}" for cat, amt in sorted(category_spend.items(), key=lambda x: -x[1])
    ) or "  None"

    # Loans summary
    total_emi = sum(l.emi for l in loans)
    loan_lines = "\n".join(
        f"  - {l.name}: ₹{l.emi:,.0f}/mo EMI, ₹{l.left_amount:,.0f} remaining, {l.rate}% rate, {l.paid_tenure}/{l.total_tenure} months paid"
        for l in loans
    ) or "  No active loans"

    # Budgets summary
    budget_lines = "\n".join(
        f"  - {b.category}: budget ₹{b.budget_amount:,.0f}" for b in budgets
    ) or "  No budgets set"

    dti = round((total_emi / monthly_income) * 100, 1) if monthly_income > 0 else 0
    save_pct = round((monthly_savings / monthly_income) * 100, 1) if monthly_income > 0 else 0

    context = f"""
=== USER FINANCIAL SNAPSHOT (as of {now.strftime('%B %Y')}) ===
Name: {user.name if hasattr(user, 'name') else 'User'}

MONTHLY OVERVIEW:
  Income:   ₹{monthly_income:,.0f}
  Spending: ₹{monthly_spent:,.0f}
  Savings:  ₹{monthly_savings:,.0f} ({save_pct}% savings rate)
  Debt-to-Income Ratio: {dti}%

ACTIVE LOANS ({len(loans)} total, Total EMI: ₹{total_emi:,.0f}/mo):
{loan_lines}

SPENDING BY CATEGORY THIS MONTH:
{cat_lines}

BUDGETS SET:
{budget_lines}
""".strip()

    return context


# ---------------------------------------------------------------------------
# GET /api/insights  — rule-based insight cards (unchanged)
# ---------------------------------------------------------------------------
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


# ---------------------------------------------------------------------------
# POST /api/insights/ask  — Gemini Flash 2.5 powered chat
# ---------------------------------------------------------------------------
@router.post("/api/insights/ask")
def ask_ai_chat(
    payload: dict = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = payload.get("text", "").strip()
    if not query:
        raise HTTPException(status_code=400, detail="Query text is required")

    # Build the financial context from live DB data
    financial_context = _build_financial_context(current_user, db)

    # Full prompt combining context + user's question
    full_prompt = f"{financial_context}\n\nUser question: {query}"

    SYSTEM_PROMPT = (
        "You are FIM (Financial Intelligence Manager), an expert personal finance AI assistant "
        "built into the SMART-EMI app. You help Indian users manage their loans, EMIs, budgets, "
        "savings, and spending. Always respond in a friendly, concise, and actionable manner. "
        "Use ₹ for Indian Rupees. Keep responses under 200 words unless the user asks for detail. "
        "Never make up data — only use the financial context provided to you."
    )

    combined_prompt = f"{SYSTEM_PROMPT}\n\n{full_prompt}"

    try:
        client = _get_gemini_client()
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=combined_prompt
        )
        reply = response.text.strip()
    except Exception as e:
        logger.error(f"Gemini API error: {e}")
        reply = (
            "I'm having trouble connecting to my AI engine right now. "
            "Please try again in a moment."
        )

    return {"text": reply}
