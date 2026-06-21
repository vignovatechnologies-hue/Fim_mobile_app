import datetime
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from database import get_db
from models import SavingsGoal, Transaction, User
from schemas import SavingsGoalCreate, SavingsGoalContribution
from dependencies import get_current_user

router = APIRouter(tags=["savings"])

GOAL_COLORS = [
    "bg-emerald-100 text-emerald-700",
    "bg-sky-100 text-sky-700",
    "bg-violet-100 text-violet-700",
    "bg-amber-100 text-amber-700",
]


def _serialize(goal: SavingsGoal) -> dict:
    return {
        "id":     goal.id,
        "name":   goal.name,
        "saved":  round(goal.saved_amount, 2),
        "target": round(goal.target_amount, 2),
        "eta":    goal.eta or "—",
        "color":  goal.color or GOAL_COLORS[0],
    }


@router.get("/api/savings")
def get_savings(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    goals = db.query(SavingsGoal).filter(SavingsGoal.user_id == current_user.id).order_by(SavingsGoal.id).all()
    return JSONResponse([_serialize(g) for g in goals])


@router.post("/api/savings")
def create_savings_goal(
    goal_data: SavingsGoalCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    count = db.query(SavingsGoal).filter(SavingsGoal.user_id == current_user.id).count()
    goal = SavingsGoal(
        user_id=current_user.id,
        name=goal_data.name.strip(),
        target_amount=goal_data.target,
        saved_amount=0.0,
        eta="12 months",
        color=GOAL_COLORS[count % len(GOAL_COLORS)],
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return JSONResponse(_serialize(goal))


@router.post("/api/savings/{goal_id}/add-money")
def add_savings_contribution(
    goal_id: int,
    contribution: SavingsGoalContribution,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    goal = db.query(SavingsGoal).filter(SavingsGoal.id == goal_id, SavingsGoal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    if contribution.amount <= 0:
        raise HTTPException(status_code=400, detail="Contribution must be > 0")

    goal.saved_amount = min(goal.target_amount, goal.saved_amount + contribution.amount)

    db.add(Transaction(
        user_id=current_user.id,
        name=f"Save — {goal.name}",
        category="Savings",
        amount=-contribution.amount,
        payment_status="debit",
        when=datetime.datetime.utcnow(),
    ))
    db.commit()
    db.refresh(goal)
    return JSONResponse(_serialize(goal))


@router.put("/api/savings/{goal_id}")
def update_savings_goal(
    goal_id: int,
    goal_data: SavingsGoalCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    goal = db.query(SavingsGoal).filter(SavingsGoal.id == goal_id, SavingsGoal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    goal.name = goal_data.name.strip()
    goal.target_amount = goal_data.target
    db.commit()
    db.refresh(goal)
    return JSONResponse(_serialize(goal))


@router.delete("/api/savings/{goal_id}")
def delete_savings_goal(
    goal_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    goal = db.query(SavingsGoal).filter(SavingsGoal.id == goal_id, SavingsGoal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    db.delete(goal)
    db.commit()
    return JSONResponse({"status": "success", "message": "Goal deleted successfully"})
