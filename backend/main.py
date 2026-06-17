from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import modular routers
from routes import auth, loans, transactions, income, savings, profile, dashboard, insights, payments

app = FastAPI(title="FIM — Financial Intelligence Manager API")

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
