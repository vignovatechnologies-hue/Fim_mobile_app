from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import modular routers
from routes import auth, loans, transactions, income, savings, profile, dashboard, insights, payments

app = FastAPI(title="FIM — Financial Intelligence Manager API")

def check_and_update_db():
    from database import engine
    from sqlalchemy import text
    try:
        with engine.begin() as conn:
            # Check if start_date exists in loans
            res = conn.execute(text(
                "SELECT column_name FROM information_schema.columns WHERE table_name='loans' AND column_name='start_date'"
            ))
            if not res.fetchone():
                conn.execute(text("ALTER TABLE loans ADD COLUMN start_date TIMESTAMP WITHOUT TIME ZONE NULL"))
                print("[Migration] Added start_date column to loans table")

            # Check if original_amount exists in loans
            res_amount = conn.execute(text(
                "SELECT column_name FROM information_schema.columns WHERE table_name='loans' AND column_name='original_amount'"
            ))
            if not res_amount.fetchone():
                conn.execute(text("ALTER TABLE loans ADD COLUMN original_amount DOUBLE PRECISION NULL"))
                print("[Migration] Added original_amount column to loans table")
            
            res2 = conn.execute(text(
                "SELECT column_name FROM information_schema.columns WHERE table_name='loans' AND column_name='end_date'"
            ))
            if not res2.fetchone():
                conn.execute(text("ALTER TABLE loans ADD COLUMN end_date TIMESTAMP WITHOUT TIME ZONE NULL"))
                print("[Migration] Added end_date column to loans table")
                
            # Check if fcm_token exists in users
            res3 = conn.execute(text(
                "SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='fcm_token'"
            ))
            if not res3.fetchone():
                conn.execute(text("ALTER TABLE users ADD COLUMN fcm_token VARCHAR(255) NULL"))
                print("[Migration] Added fcm_token column to users table")
    except Exception as e:
        print(f"[Migration] Error updating database tables: {e}")

async def start_reminder_scheduler():
    import asyncio
    from database import SessionLocal
    from reminders import check_and_send_reminders
    await asyncio.sleep(5)
    while True:
        try:
            print("[Scheduler] Running daily check for unpaid EMIs...")
            db = SessionLocal()
            try:
                result = check_and_send_reminders(db)
                print(f"[Scheduler] Done. Reminders check result: {result}")
            finally:
                db.close()
        except Exception as e:
            print(f"[Scheduler] Error in reminder scheduler: {e}")
        # Sleep for 24 hours
        await asyncio.sleep(24 * 3600)

@app.on_event("startup")
def on_startup():
    # Auto-create all tables if they don't exist (safe for fresh deployments)
    from database import Base, engine
    from init_db import seed_database
    Base.metadata.create_all(bind=engine)
    print("[Startup] Database tables created/verified.")
    seed_database()
    check_and_update_db()
    import asyncio
    asyncio.create_task(start_reminder_scheduler())



# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For local testing, allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all modular routers
app.include_router(auth.router)
app.include_router(loans.router)
app.include_router(transactions.router)
app.include_router(income.router)
app.include_router(savings.router)
app.include_router(profile.router)
app.include_router(dashboard.router)
app.include_router(insights.router)
app.include_router(payments.router)

@app.get("/")
def read_root():
    return {"message": "FIM API is running successfully. All routes are modularized."}

@app.api_route("/health", methods=["GET", "HEAD"])
def health_check():
    """Lightweight health check endpoint — used by UptimeRobot to keep Render server alive.
    Accepts both GET and HEAD (UptimeRobot sends HEAD by default).
    No DB queries, no auth. Always returns 200 instantly."""
    return {"status": "ok"}

from fastapi.responses import HTMLResponse
from legal_html import PRIVACY_POLICY_HTML, TERMS_OF_USE_HTML

@app.get("/privacy-policy", response_class=HTMLResponse)
def privacy_policy():
    """Renders the FIM Privacy Policy as a public HTML webpage for Google Play compliance."""
    return HTMLResponse(content=PRIVACY_POLICY_HTML, status_code=200)

@app.get("/terms-of-use", response_class=HTMLResponse)
def terms_of_use():
    """Renders the FIM Terms of Use as a public HTML webpage for Google Play compliance."""
    return HTMLResponse(content=TERMS_OF_USE_HTML, status_code=200)
