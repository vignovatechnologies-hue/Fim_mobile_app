import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Numeric
from sqlalchemy.orm import relationship, validates
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    password_hash = Column(String, nullable=False)
    verified = Column(Boolean, default=False)
    verification_code = Column(String, nullable=True)
    verification_expires = Column(DateTime, nullable=True)
    reset_code = Column(String, nullable=True)
    reset_expires = Column(DateTime, nullable=True)
    premium = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    loans = relationship("Loan", back_populates="user", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")
    savings_goals = relationship("SavingsGoal", back_populates="user", cascade="all, delete-orphan")
    banks = relationship("Bank", back_populates="user", cascade="all, delete-orphan")
    budgets = relationship("Budget", back_populates="user", cascade="all, delete-orphan")


class Loan(Base):
    __tablename__ = "loans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)  # Home, Personal, Auto, Education, Consumer
    emi = Column(Float, nullable=False)
    left_amount = Column(Float, nullable=False)
    total_tenure = Column(Integer, nullable=False)
    paid_tenure = Column(Integer, default=0)
    rate = Column(Float, nullable=False)
    due_day = Column(Integer, nullable=False)  # Day of the month
    logo = Column(String, nullable=False)
    paid_this_month = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="loans")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)  # Food, Shopping, Transport, Entertainment, Home, Income, Savings
    amount = Column(Float, nullable=False)       # Negative for expenses, positive for income/savings
    payment_status = Column(String, nullable=False)  # "credit" = money in, "debit" = money out
    when = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="transactions")

    @validates('amount')
    def update_payment_status(self, key, value):
        self.payment_status = "credit" if value > 0 else "debit"
        return value


class SavingsGoal(Base):
    __tablename__ = "savings_goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    target_amount = Column(Float, nullable=False)
    saved_amount = Column(Float, default=0.0)
    eta = Column(String, nullable=True)
    color = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="savings_goals")


class Bank(Base):
    __tablename__ = "banks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    masked_acc = Column(String, nullable=False)
    ifsc_code = Column(String, nullable=True)        # validated IFSC code
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="banks")


class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    category = Column(String, nullable=False)  # Food & Dining, Shopping, Transport, Entertainment, Home & Bills
    budget_amount = Column(Float, nullable=False)

    user = relationship("User", back_populates="budgets")
