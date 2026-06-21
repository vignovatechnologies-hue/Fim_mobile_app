from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

# Auth Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# User Schemas
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    phone: Optional[str] = None
    initials: str
    verified: bool
    premium: bool

    class Config:
        from_attributes = True

class UserVerify(BaseModel):
    email: EmailStr
    code: str

class UserResetRequest(BaseModel):
    email: EmailStr

class UserResetSubmit(BaseModel):
    email: EmailStr
    code: str
    new_password: str

# Loan Schemas
class LoanCreate(BaseModel):
    name: str
    type: str  # Home, Personal, Auto, Education, Consumer
    emi: float
    rate: float
    due_day: Optional[int] = 15
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    left_amount: Optional[float] = None
    total_tenure: Optional[int] = None
    paid_tenure: Optional[int] = None

class LoanUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    emi: Optional[float] = None
    rate: Optional[float] = None
    due_day: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    left_amount: Optional[float] = None
    total_tenure: Optional[int] = None
    paid_tenure: Optional[int] = None

class LoanResponse(BaseModel):
    id: int
    name: str
    type: str
    emi: float
    left: float = Field(..., alias="left_amount")
    tenure: str
    rate: float
    due: int = Field(..., alias="due_day")
    logo: str
    paid: bool = Field(..., alias="paid_this_month")
    start_date: Optional[str] = None
    end_date: Optional[str] = None

    class Config:
        from_attributes = True
        populate_by_name = True

    @classmethod
    def from_orm_model(cls, loan):
        # tenure formatting paid_tenure/total_tenure
        tenure_str = f"{loan.paid_tenure}/{loan.total_tenure}"
        return cls(
            id=loan.id,
            name=loan.name,
            type=loan.type,
            emi=loan.emi,
            left_amount=loan.left_amount,
            tenure=tenure_str,
            rate=loan.rate,
            due_day=loan.due_day,
            logo=loan.logo,
            paid_this_month=loan.paid_this_month,
            start_date=loan.start_date.isoformat() if loan.start_date else None,
            end_date=loan.end_date.isoformat() if loan.end_date else None
        )

# Transaction Schemas
class TransactionCreate(BaseModel):
    name: str
    category: str
    amount: float

class TransactionResponse(BaseModel):
    id: int
    name: str
    cat: str = Field(..., alias="category")
    amount: float
    payment_status: str
    when: str

    class Config:
        from_attributes = True
        populate_by_name = True

    @classmethod
    def from_orm_model(cls, txn):
        # Format the relative date/timestamp
        # Simple formatting for simplicity, e.g. "Today", "Yesterday", or "2 Jun"
        now = datetime.utcnow()
        diff = now - txn.when
        if diff.days == 0:
            when_str = "Today, " + txn.when.strftime("%I:%M%p").lower()
        elif diff.days == 1:
            when_str = "Yesterday"
        else:
            when_str = txn.when.strftime("%d %b")
            
        return cls(
            id=txn.id,
            name=txn.name,
            category=txn.category,
            amount=txn.amount,
            payment_status=txn.payment_status or ("credit" if txn.amount > 0 else "debit"),
            when=when_str
        )

# Budget Schemas
class BudgetCategoryResponse(BaseModel):
    name: str
    spent: float
    budget: float
    color: str

# Savings Goal Schemas
class SavingsGoalCreate(BaseModel):
    name: str
    target: float = Field(..., alias="target_amount")

    class Config:
        populate_by_name = True

class SavingsGoalResponse(BaseModel):
    id: int
    name: str
    saved: float = Field(..., alias="saved_amount")
    target: float = Field(..., alias="target_amount")
    eta: Optional[str] = "—"
    color: Optional[str] = "bg-emerald-100 text-emerald-700"

    class Config:
        from_attributes = True
        populate_by_name = True

# Savings Goal Contribution
class SavingsGoalContribution(BaseModel):
    amount: float


# Bank Schemas
class BankCreate(BaseModel):
    name: str
    account_number: str
    ifsc_code: str

class BankResponse(BaseModel):
    id: int
    name: str
    masked: str = Field(..., alias="masked_acc")
    ifsc_code: Optional[str] = None

    class Config:
        from_attributes = True
        populate_by_name = True

# Dashboard Summary Schema
class DashboardSummary(BaseModel):
    net_balance: float
    income: float
    spent: float
    active_loans_count: int
    outstanding_loans_amount: float
    health_score: int
    savings_goal_percent: float
    savings_goal_text: str
    next_emi_days: str
    next_emi_name: str

class FCMTokenRegister(BaseModel):
    fcm_token: str
