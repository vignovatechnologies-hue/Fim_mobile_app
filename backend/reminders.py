import datetime
import calendar
import requests
import os
import firebase_admin
from firebase_admin import credentials, messaging
from sqlalchemy.orm import Session
from models import Loan, User
from config import settings
from email_utils import send_via_smtp, send_via_sendgrid_api

_firebase_initialized = False

def send_fcm_notification(fcm_token: str, recipient_name: str, title: str, body: str) -> bool:
    """
    Sends a Firebase Cloud Messaging push notification using Firebase Admin SDK.
    Falls back to console logs if credentials are not configured.
    """
    global _firebase_initialized
    if not fcm_token:
        return False
        
    try:
        if not _firebase_initialized:
            try:
                firebase_admin.get_app()
                _firebase_initialized = True
            except ValueError:
                cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH")
                if cred_path and os.path.exists(cred_path):
                    cred = credentials.Certificate(cred_path)
                    firebase_admin.initialize_app(cred)
                else:
                    firebase_admin.initialize_app()
                _firebase_initialized = True
                
        message = messaging.Message(
            notification=messaging.Notification(
                title=title,
                body=body,
            ),
            token=fcm_token,
        )
        response = messaging.send(message)
        print(f"[Firebase Push] ✅ Notification sent successfully to {recipient_name}: {response}")
        return True
    except Exception as e:
        # Fallback console print for development
        print("\n" + "="*60)
        print(f"🔔 [FIREBASE PUSH MOCK FALLBACK]")
        print(f"To: {recipient_name} (token: {fcm_token})")
        print(f"Title: {title}")
        print(f"Body: {body}")
        print(f"Details: {e}")
        print("💡 Place Firebase service account file at FIREBASE_CREDENTIALS_PATH in backend/.env for real delivery.")
        print("="*60 + "\n")
        return True

def send_sms(phone: str, recipient_name: str, body: str) -> bool:
    """
    Sends an SMS using Twilio API or falls back to console logs if credentials are not set.
    """
    if settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN and settings.TWILIO_FROM_NUMBER:
        url = f"https://api.twilio.com/2010-04-01/Accounts/{settings.TWILIO_ACCOUNT_SID}/Messages.json"
        auth = (settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        data = {
            "From": settings.TWILIO_FROM_NUMBER,
            "To": phone,
            "Body": body
        }
        try:
            response = requests.post(url, data=data, auth=auth, timeout=10)
            if response.status_code in (200, 201):
                print(f"[Twilio SMS] ✅ SMS sent successfully to {phone}")
                return True
            else:
                print(f"[Twilio SMS] ❌ Failed to send SMS: {response.text}")
                return False
        except Exception as e:
            print(f"[Twilio SMS] ❌ Exception sending SMS: {e}")
            return False
    else:
        # Fallback console print for development
        print("\n" + "="*60)
        print(f"📱 [SMS MOCK FALLBACK]")
        print(f"To: {recipient_name} ({phone})")
        print(f"Message: {body}")
        print("💡 Config TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER in backend/.env for real delivery.")
        print("="*60 + "\n")
        return True

def send_emi_reminder_email(to_email: str, recipient_name: str, loan_name: str, emi_amount: float, left_amount: float, due_date_str: str, days_left: int) -> bool:
    """
    Sends a premium, beautifully styled HTML email reminder.
    """
    subject = f"EMI Reminder: {loan_name} due in {days_left} days"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{subject}</title>
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                background-color: #f9fafb;
                margin: 0;
                padding: 0;
                color: #1f2937;
            }}
            .container {{
                max-width: 500px;
                margin: 40px auto;
                background-color: #ffffff;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
                border: 1px solid #f3f4f6;
            }}
            .header {{
                background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
                padding: 32px 24px;
                text-align: center;
                color: #ffffff;
            }}
            .header h1 {{
                margin: 0;
                font-size: 24px;
                font-weight: 800;
                letter-spacing: -0.025em;
            }}
            .header p {{
                margin: 4px 0 0 0;
                font-size: 13px;
                opacity: 0.9;
            }}
            .content {{
                padding: 32px 24px;
                text-align: left;
            }}
            .greeting {{
                font-size: 16px;
                font-weight: 600;
                margin-top: 0;
                margin-bottom: 12px;
            }}
            .text {{
                font-size: 14px;
                line-height: 1.5;
                color: #4b5563;
                margin-bottom: 24px;
            }}
            .details-card {{
                background-color: #f3f4f6;
                border-radius: 12px;
                padding: 20px;
                margin-bottom: 24px;
            }}
            .detail-row {{
                display: flex;
                justify-content: space-between;
                margin-bottom: 10px;
                font-size: 14px;
            }}
            .detail-row:last-child {{
                margin-bottom: 0;
            }}
            .detail-label {{
                color: #6b7280;
                font-weight: 500;
            }}
            .detail-value {{
                color: #111827;
                font-weight: 700;
            }}
            .cta-button {{
                display: block;
                text-align: center;
                background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
                color: #ffffff !important;
                text-decoration: none;
                font-weight: 700;
                font-size: 14px;
                padding: 14px 20px;
                border-radius: 12px;
                margin-bottom: 24px;
                box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.2), 0 2px 4px -1px rgba(99, 102, 241, 0.1);
            }}
            .footer {{
                background-color: #f9fafb;
                padding: 24px;
                text-align: center;
                border-top: 1px solid #f3f4f6;
                font-size: 11px;
                color: #9ca3af;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>FIM</h1>
                <p>Upcoming EMI Notification</p>
            </div>
            <div class="content">
                <p class="greeting">Hi {recipient_name},</p>
                <p class="text">
                    This is a reminder that your EMI payment for <strong>{loan_name}</strong> is due in {days_left} days. Please make the payment to keep your health score optimal.
                </p>
                <div class="details-card">
                    <div class="detail-row">
                        <span class="detail-label">EMI Amount</span>
                        <span class="detail-value">₹ {emi_amount:,.2f}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Due Date</span>
                        <span class="detail-value">{due_date_str}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Outstanding Principal</span>
                        <span class="detail-value">₹ {left_amount:,.2f}</span>
                    </div>
                </div>
                <a href="http://localhost:5173/emis" class="cta-button">Pay EMI Now</a>
            </div>
            <div class="footer">
                <p>© 2026 FIM. Secured with 256-bit encryption.</p>
                <p>Made in India 🇮🇳</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    # Check if SMTP is configured
    if settings.SMTP_HOST and settings.SMTP_FROM_EMAIL:
        return send_via_smtp(to_email, recipient_name, subject, html_content)
    # Check if SendGrid API is configured
    elif settings.SENDGRID_API_KEY and settings.SENDGRID_FROM_EMAIL and not settings.SENDGRID_API_KEY.startswith("SG.YOUR_"):
        return send_via_sendgrid_api(to_email, recipient_name, subject, html_content)
    else:
        # Fallback to local console print (very useful for local dev)
        print("\n" + "="*60)
        print(f"📧 [EMAIL MOCK FALLBACK]")
        print(f"To: {recipient_name} <{to_email}>")
        print(f"Subject: {subject}")
        print(f"Due Date: {due_date_str} (in {days_left} days)")
        print("💡 Config SMTP or SendGrid in backend/.env for real delivery.")
        print("="*60 + "\n")
        return True

def check_and_send_reminders(db: Session) -> dict:
    """
    Core function that scans database for all unpaid loans and sends reminders.
    Rules:
    - Send reminder if today is 3 days before the due date, up to the due date.
    - Specifically, today.day >= loan.due_day - 3.
    - Send via Email and SMS if user has verified phone/email.
    """
    today = datetime.date.today()
    current_month_name = today.strftime("%b")
    
    # Query all active, unpaid loans
    unpaid_loans = db.query(Loan).filter(Loan.paid_this_month == False).all()
    
    emails_sent = 0
    sms_sent = 0
    details = []
    
    for loan in unpaid_loans:
        # Find the owner user
        user = db.query(User).filter(User.id == loan.user_id).first()
        if not user:
            continue
            
        due_day = loan.due_day
        # Determine target due date in the current month
        try:
            due_date = datetime.date(today.year, today.month, due_day)
        except ValueError:
            # Handle months with fewer days than due_day (e.g. Feb 30)
            last_day = calendar.monthrange(today.year, today.month)[1]
            due_date = datetime.date(today.year, today.month, last_day)
            due_day = last_day
            
        due_date_str = f"{due_day} {current_month_name}"
        days_left = (due_date - today).days
        
        # Check if today is between due_date - 3 days and due_date (inclusive, or if overdue)
        if today.day >= due_day - 3:
            # Send Email
            email_success = send_emi_reminder_email(
                to_email=user.email,
                recipient_name=user.name,
                loan_name=loan.name,
                emi_amount=loan.emi,
                left_amount=loan.left_amount,
                due_date_str=due_date_str,
                days_left=max(0, days_left)
            )
            if email_success:
                emails_sent += 1
                
            # Send SMS
            phone_num = user.phone or "+91 99999 99999"  # default placeholder if user has no phone number
            sms_body = f"Dear {user.name}, your EMI of Rs.{loan.emi:,.0f} for {loan.name} is due on {due_date_str} (in {max(0, days_left)} days). Please pay soon via FIM to avoid late charges. - FIM"
            
            sms_success = send_sms(
                phone=phone_num,
                recipient_name=user.name,
                body=sms_body
            )
            if sms_success:
                sms_sent += 1
                
            # Send FCM push notification
            if user.fcm_token:
                send_fcm_notification(
                    fcm_token=user.fcm_token,
                    recipient_name=user.name,
                    title="EMI Reminder",
                    body=sms_body
                )
                
            details.append({
                "loan_id": loan.id,
                "loan_name": loan.name,
                "user_email": user.email,
                "user_phone": phone_num,
                "due_date": due_date_str,
                "days_left": days_left
            })
            
    return {
        "status": "success",
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "emails_sent": emails_sent,
        "sms_sent": sms_sent,
        "reminders": details
    }
