import datetime
import urllib.parse
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

from config import settings
from database import engine, Base, SessionLocal
from models import User, Loan, Transaction, SavingsGoal, Bank, Budget
from auth_utils import get_password_hash

def create_database_if_not_exists():
    # Parse settings database URL to connect to the default 'postgres' database first
    decoded_password = urllib.parse.unquote(settings.DB_PASSWORD)
    
    try:
        # Connect to postgres template database
        conn = psycopg2.connect(
            user=settings.DB_USER,
            password=decoded_password,
            host=settings.DB_HOST,
            port=settings.DB_PORT,
            database="postgres"
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        # Check if DB exists
        cursor.execute("SELECT 1 FROM pg_catalog.pg_database WHERE datname = %s", (settings.DB_NAME,))
        exists = cursor.fetchone()
        
        if not exists:
            print(f"Database {settings.DB_NAME} does not exist. Creating...")
            cursor.execute(f'CREATE DATABASE {settings.DB_NAME};')
            print(f"Database {settings.DB_NAME} created successfully.")
        else:
            print(f"Database {settings.DB_NAME} already exists.")
            
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error checking/creating database: {e}")

def seed_database():
    db = SessionLocal()
    try:
        # Check if the demo user already exists
        demo_user = db.query(User).filter(User.email == "demo@fim.in").first()
        if demo_user:
            print("Demo user 'demo@fim.in' already exists. Seeding skipped.")
            return

        print("Seeding database with default Arjun Reddy demo account...")
        
        # Create User
        user = User(
            email="demo@fim.in",
            name="Arjun Reddy",
            phone="+91 98765 43210",
            password_hash=get_password_hash("demo1234"),
            verified=True,
            premium=False
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Create default Loans
        loans = [
            Loan(user_id=user.id, name="HDFC Home Loan", type="Home", emi=24500, left_amount=1820000, total_tenure=180, paid_tenure=126, rate=8.4, due_day=5, logo="🏠", paid_this_month=False),
            Loan(user_id=user.id, name="Bajaj Personal", type="Personal", emi=8200, left_amount=142000, total_tenure=36, paid_tenure=18, rate=14.5, due_day=7, logo="💳", paid_this_month=False),
            Loan(user_id=user.id, name="ICICI Car Loan", type="Auto", emi=11800, left_amount=312000, total_tenure=60, paid_tenure=32, rate=9.2, due_day=10, logo="🚗", paid_this_month=False),
            Loan(user_id=user.id, name="Tata Capital", type="Consumer", emi=2400, left_amount=18400, total_tenure=12, paid_tenure=8, rate=16.0, due_day=12, logo="📱", paid_this_month=False),
            Loan(user_id=user.id, name="SBI Education", type="Education", emi=1300, left_amount=48000, total_tenure=48, paid_tenure=24, rate=10.1, due_day=15, logo="🎓", paid_this_month=False)
        ]
        db.add_all(loans)
        
        # Create default budgets
        budgets = [
            Budget(user_id=user.id, category="Food & Dining", budget_amount=15000),
            Budget(user_id=user.id, category="Shopping", budget_amount=8000),
            Budget(user_id=user.id, category="Transport", budget_amount=6000),
            Budget(user_id=user.id, category="Entertainment", budget_amount=4000),
            Budget(user_id=user.id, category="Home & Bills", budget_amount=20000)
        ]
        db.add_all(budgets)
        
        # Create default Transactions (seed some to reach category spent targets in frontend)
        # Category spends: Food=12400, Shopping=8900, Transport=4200, Entertainment=3100, Home=18200
        # Dynamic calculation will sum up transactions.
        txns = [
            # Recent visible ones
            Transaction(user_id=user.id, name="Zomato", category="Food & Dining", amount=-480, payment_status="debit", when=datetime.datetime.utcnow()),
            Transaction(user_id=user.id, name="Salary — Infosys", category="Income", amount=142000, payment_status="credit", when=datetime.datetime.utcnow() - datetime.timedelta(days=1)),
            Transaction(user_id=user.id, name="Amazon", category="Shopping", amount=-2349, payment_status="debit", when=datetime.datetime.utcnow() - datetime.timedelta(days=1)),
            Transaction(user_id=user.id, name="BPCL Petrol", category="Transport", amount=-1200, payment_status="debit", when=datetime.datetime.utcnow() - datetime.timedelta(days=3)),
            Transaction(user_id=user.id, name="Netflix", category="Entertainment", amount=-649, payment_status="debit", when=datetime.datetime.utcnow() - datetime.timedelta(days=4)),
            
            # Helper historical/bulk transactions to align with totals (Food targets: 12400 - 480 = 11920)
            Transaction(user_id=user.id, name="Grocery & Dining Historical", category="Food & Dining", amount=-11920, payment_status="debit", when=datetime.datetime.utcnow() - datetime.timedelta(days=5)),
            Transaction(user_id=user.id, name="Shopping Historical", category="Shopping", amount=-6551, payment_status="debit", when=datetime.datetime.utcnow() - datetime.timedelta(days=6)),
            Transaction(user_id=user.id, name="Transport historical", category="Transport", amount=-3000, payment_status="debit", when=datetime.datetime.utcnow() - datetime.timedelta(days=8)),
            Transaction(user_id=user.id, name="Rent & Bills historical", category="Home & Bills", amount=-18200, payment_status="debit", when=datetime.datetime.utcnow() - datetime.timedelta(days=2)),
            Transaction(user_id=user.id, name="Movies & Gaming historical", category="Entertainment", amount=-2451, payment_status="debit", when=datetime.datetime.utcnow() - datetime.timedelta(days=10)),
            
            # Other income sources
            Transaction(user_id=user.id, name="Freelance — Acme", category="Income", amount=38000, payment_status="credit", when=datetime.datetime.utcnow() - datetime.timedelta(days=15)),
            Transaction(user_id=user.id, name="Dividends", category="Income", amount=4200, payment_status="credit", when=datetime.datetime.utcnow() - datetime.timedelta(days=20)),
            Transaction(user_id=user.id, name="Rental — 2BHK", category="Income", amount=25800, payment_status="credit", when=datetime.datetime.utcnow() - datetime.timedelta(days=5))
        ]
        db.add_all(txns)

        # Create default savings goals
        goals = [
            SavingsGoal(user_id=user.id, name="Emergency Fund", target_amount=360000, saved_amount=280000, eta="4 months", color="bg-emerald-100 text-emerald-700"),
            SavingsGoal(user_id=user.id, name="Bali Trip 2027", target_amount=180000, saved_amount=62000, eta="9 months", color="bg-sky-100 text-sky-700"),
            SavingsGoal(user_id=user.id, name="Kid's Education", target_amount=1500000, saved_amount=540000, eta="5 years", color="bg-violet-100 text-violet-700"),
            SavingsGoal(user_id=user.id, name="Home Down-Payment", target_amount=2000000, saved_amount=820000, eta="2.5 years", color="bg-amber-100 text-amber-700")
        ]
        db.add_all(goals)

        # Create default linked banks
        banks = [
            Bank(user_id=user.id, name="HDFC Bank", masked_acc="•••• 4521"),
            Bank(user_id=user.id, name="ICICI Bank", masked_acc="•••• 8890"),
            Bank(user_id=user.id, name="SBI", masked_acc="•••• 1207")
        ]
        db.add_all(banks)

        db.commit()
        print("Database seeded successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

def main():
    create_database_if_not_exists()
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully.")
    seed_database()

if __name__ == "__main__":
    main()
