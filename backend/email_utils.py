import requests
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from config import settings

def send_via_smtp(to_email: str, recipient_name: str, subject: str, html_content: str) -> bool:
    """Sends email using SMTP (Nodemailer equivalent)."""
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"FIM Support <{settings.SMTP_FROM_EMAIL}>"
        msg["To"] = f"{recipient_name} <{to_email}>"
        
        msg.attach(MIMEText(html_content, "html"))
        
        if settings.SMTP_PORT == 465:
            server = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10)
        else:
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10)
            server.ehlo()
            server.starttls()
            server.ehlo()
            
        if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            
        server.sendmail(settings.SMTP_FROM_EMAIL, to_email, msg.as_string())
        server.quit()
        print(f"[SMTP] ✅ OTP email sent successfully to {to_email}")
        return True
    except Exception as e:
        print(f"[SMTP] ❌ Exception occurred while sending email: {e}")
        return False

def send_via_sendgrid_api(to_email: str, recipient_name: str, subject: str, html_content: str) -> bool:
    """Sends email using SendGrid HTTP REST API."""
    url = "https://api.sendgrid.com/v3/mail/send"
    headers = {
        "Authorization": f"Bearer {settings.SENDGRID_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "personalizations": [
            {
                "to": [{"email": to_email, "name": recipient_name}],
                "subject": subject
            }
        ],
        "from": {
            "email": settings.SENDGRID_FROM_EMAIL,
            "name": "FIM Support"
        },
        "content": [
            {
                "type": "text/html",
                "value": html_content
            }
        ]
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        if response.status_code in (200, 201, 202):
            print(f"[SendGrid API] ✅ OTP email sent successfully to {to_email}")
            return True
        else:
            print(f"[SendGrid API] ❌ Failed to send email (HTTP {response.status_code}): {response.text}")
            return False
    except Exception as e:
        print(f"[SendGrid API] ❌ Exception occurred while sending email: {e}")
        return False

def send_otp_email(to_email: str, recipient_name: str, otp: str, purpose: str) -> bool:
    """
    Sends an OTP verification email.
    Supports SMTP (like Nodemailer) or SendGrid HTTP API.
    Falls back to console output if no credentials are configured.
    
    purposes: 'signup', 'reset', 'resend'
    """
    subject_map = {
        "signup": "Verify your email - FIM",
        "reset": "Reset your password - FIM",
        "resend": "Your new OTP code - FIM"
    }
    
    purpose_text_map = {
        "signup": "Welcome to FIM! Use the verification code below to complete your registration and activate your account.",
        "reset": "We received a request to reset your password. Use the verification code below to set a new password.",
        "resend": "Here is your requested verification code."
    }
    
    subject = subject_map.get(purpose, "Verification Code - FIM")
    purpose_text = purpose_text_map.get(purpose, "Use the verification code below to proceed.")
    
    # Clean up the OTP for displaying spaces between characters (e.g. "1 2 3 4 5 6")
    otp_spaced = " ".join(list(otp))
    
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
                text-align: center;
            }}
            .greeting {{
                font-size: 16px;
                font-weight: 600;
                margin-top: 0;
                margin-bottom: 12px;
                text-align: left;
            }}
            .text {{
                font-size: 14px;
                line-height: 1.5;
                color: #4b5563;
                margin-bottom: 24px;
                text-align: left;
            }}
            .code-box {{
                background-color: #f3f4f6;
                border-radius: 12px;
                padding: 18px;
                font-size: 28px;
                font-weight: 800;
                letter-spacing: 4px;
                color: #4f46e5;
                display: inline-block;
                margin: 0 auto 24px auto;
                font-family: monospace;
            }}
            .footer {{
                background-color: #f9fafb;
                padding: 24px;
                text-align: center;
                border-top: 1px solid #f3f4f6;
                font-size: 11px;
                color: #9ca3af;
            }}
            .footer a {{
                color: #6366f1;
                text-decoration: none;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>FIM</h1>
                <p>Financial Intelligence Manager</p>
            </div>
            <div class="content">
                <p class="greeting">Hi {recipient_name},</p>
                <p class="text">{purpose_text}</p>
                <div class="code-box">{otp_spaced}</div>
                <p class="text" style="font-size: 12px; color: #9ca3af; margin-bottom: 0;">
                    This code is valid for 10 minutes. If you did not request this code, please ignore this email.
                </p>
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
        
    # Fallback to local console print (very useful for local dev)
    else:
        print("\n" + "="*60)
        print(f"📧 [EMAIL MOCK FALLBACK] ({purpose.upper()})")
        print(f"To: {recipient_name} <{to_email}>")
        print(f"Subject: {subject}")
        print(f"OTP Code: {otp}")
        print("💡 Config SMTP or SendGrid in backend/.env for real delivery.")
        print("="*60 + "\n")
        return True
