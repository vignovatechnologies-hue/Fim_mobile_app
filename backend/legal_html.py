# Premium HTML templates for FIM legal pages.
# These match the FIM brand color system (#0f4a3f) and are responsive for mobile/desktop.

PRIVACY_POLICY_HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Privacy Policy - FIM (Financial Intelligence Manager)</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #374151;
            background-color: #f9fafb;
            margin: 0;
            padding: 0;
        }
        .header {
            background: linear-gradient(135deg, #0f4a3f 0%, #0d3a31 100%);
            color: white;
            text-align: center;
            padding: 40px 20px;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 800;
        }
        .header p {
            margin: 5px 0 0 0;
            font-size: 14px;
            color: #a7f3d0;
            font-weight: 600;
        }
        .container {
            max-width: 800px;
            margin: 30px auto;
            background: white;
            padding: 40px;
            border-radius: 16px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
            border: 1px solid #f3f4f6;
        }
        .date {
            font-size: 13px;
            color: #6b7280;
            margin-bottom: 20px;
            font-weight: 600;
        }
        h2 {
            color: #0f4a3f;
            font-size: 20px;
            border-bottom: 2px solid #ecfdf5;
            padding-bottom: 8px;
            margin-top: 30px;
        }
        h3 {
            color: #111827;
            font-size: 15px;
            margin-top: 15px;
            margin-bottom: 5px;
        }
        p, li {
            font-size: 14px;
            color: #4b5563;
        }
        ul {
            padding-left: 20px;
        }
        li {
            margin-bottom: 8px;
        }
        .highlight-box {
            background-color: #ecfdf5;
            border-left: 4px solid #10b981;
            padding: 15px 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .highlight-box p {
            margin: 0;
            color: #065f46;
            font-weight: 600;
        }
        .footer {
            text-align: center;
            padding: 30px 20px;
            color: #9ca3af;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>FIM</h1>
        <p>Financial Intelligence Manager</p>
    </div>
    <div class="container">
        <div class="date">
            Effective Date: June 20, 2026<br>
            Last Updated: June 28, 2026
        </div>
        
        <p>At FIM (Financial Intelligence Manager), developed by <strong>Vignova Technologies</strong> ("we", "us", or "our"), we respect your privacy and are committed to protecting your personal financial data. This Privacy Policy describes how we collect, use, store, process, and protect your information when you use our mobile application and services.</p>
        
        <div class="highlight-box">
            <p>🛡️ Strict Security & Manual Control: FIM is a manual personal finance tracker. We do NOT scrape, monitor, or automatically link to your real-time bank accounts, nor do we collect or store your net banking credentials, PINs, or security questions. All tracking data is entered manually by you.</p>
        </div>

        <h2>1. Information We Collect</h2>
        <p>FIM collects and stores data that you voluntarily provide to us to enable the application's calculations, tracking features, and reminders:</p>
        
        <h3>• Account Registration Information:</h3>
        <p>When you create an account, we collect your name, email address, password, and optional phone number. This is used to authenticate your identity, secure your profile, and deliver OTPs for account verification or password resets.</p>
        
        <h3>• Manually Logged Financial Profiles:</h3>
        <p>To generate amortization schedules, savings progress, and budget summaries, we store the financial data you enter, including:</p>
        <ul>
            <li>Loan details (lender name, principal amount, annual interest rate, tenure, start date, and due day).</li>
            <li>Daily expenses (description, category, amount, and timestamp).</li>
            <li>Income sources (source description, amount, and category).</li>
            <li>Savings goals (goal name, target amount, and contributions).</li>
        </ul>

        <h3>• Mock Bank Account Display (Optional):</h3>
        <p>You may enter a bank name, IFSC code, and masked account number. This is used solely as a visual label to help you organize which real-world bank account you use to pay specific EMIs. We do NOT connect to core banking APIs (such as UPI or Open Banking) and cannot view your actual bank balances.</p>

        <h3>• Device and Push Notification Tokens:</h3>
        <p>We collect your device’s operating system (Android/iOS) and Firebase Cloud Messaging (FCM) token. This is used exclusively to dispatch push notifications to remind you of upcoming EMI due dates.</p>

        <h2>2. AI Security & Google Gemini API</h2>
        <p>Our interactive financial advisor chatbot is powered by the Google Gemini 2.5 Flash API. To safeguard your financial privacy, we enforce the following security guardrails:</p>
        <ul>
            <li>We <strong>never</strong> transmit sensitive details such as bank account numbers, passwords, PINs, or government-issued IDs (like PAN or Aadhaar) to the AI model.</li>
            <li>The AI assistant is only sent aggregated, anonymized loan summaries (e.g. loan tenure, interest rate, and outstanding balance) to provide contextually relevant payoff advice or refinancing suggestions.</li>
            <li>According to Google's API Terms of Service, data sent via the Gemini API is kept private and is not used to train public foundational AI models.</li>
        </ul>

        <h2>3. How We Use Your Information</h2>
        <p>We use the collected data strictly to operate, maintain, and improve the features of the FIM application:</p>
        <ul>
            <li>To calculate interest savings, generate amortization schedules, and run prepayment simulators.</li>
            <li>To send email alerts and reminders about upcoming EMI due dates from our official system address (<strong>vignova.official@gmail.com</strong>).</li>
            <li>To trigger push notifications on your mobile device to ensure you never miss an EMI deadline.</li>
            <li>To diagnose bugs, monitor application performance, and improve user interface layouts.</li>
        </ul>

        <h2>4. Data Sharing & Third-Party Partners</h2>
        <p>We do <strong>NOT</strong> sell, rent, trade, or share your personal financial data with third-party advertisers or lenders. We only share information with trusted service providers necessary to run the app:</p>
        <ul>
            <li><strong>Google Gemini API:</strong> Used to process your natural language questions in the AI Insights tab.</li>
            <li><strong>Razorpay:</strong> Used in sandbox/test mode to simulate premium subscription upgrades. If live billing is enabled, Razorpay processes payments securely under PCI-DSS compliance. FIM never sees or stores your raw credit card numbers or net banking passwords.</li>
            <li><strong>Firebase (Google Cloud):</strong> Used to manage push notification tokens and dispatch alerts to your mobile device.</li>
        </ul>

        <h2>5. Data Security & Retention</h2>
        <p>All communications between the FIM mobile app and our servers are encrypted in transit using industry-standard HTTPS (SSL/TLS). Your data is stored in secure databases protected by firewalls and access controls.</p>
        <p><strong>Your Rights:</strong> You have the right to access, edit, or update your financial logs at any time. You also have the right to <strong>completely delete</strong> your account. Requesting account deletion will permanently erase all your personal details, loan records, income logs, and expense trackers from our active databases.</p>

        <h2>6. Contact Us</h2>
        <p>If you have questions regarding this Privacy Policy, wish to exercise your data rights, or want to request the permanent deletion of your account and data, please contact us:</p>
        <p>
            <strong>Vignova Technologies</strong><br>
            Email: <a href="mailto:vignova.official@gmail.com" style="color: #10b981; font-weight: bold; text-decoration: none;">vignova.official@gmail.com</a>
        </p>
        <p><strong>Jurisdiction:</strong> This policy is governed by the laws of India. Any data processing complies with applicable local guidelines, including RBI standards for manual financial calculators where referenced.</p>
    </div>
    <div class="footer">
        <p>© 2026 FIM. Secured with 256-bit encryption. Made in India 🇮🇳</p>
    </div>
</body>
</html>
"""

TERMS_OF_USE_HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Terms of Use - FIM (Financial Intelligence Manager)</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #374151;
            background-color: #f9fafb;
            margin: 0;
            padding: 0;
        }
        .header {
            background: linear-gradient(135deg, #0f4a3f 0%, #0d3a31 100%);
            color: white;
            text-align: center;
            padding: 40px 20px;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 800;
        }
        .header p {
            margin: 5px 0 0 0;
            font-size: 14px;
            color: #a7f3d0;
            font-weight: 600;
        }
        .container {
            max-width: 800px;
            margin: 30px auto;
            background: white;
            padding: 40px;
            border-radius: 16px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
            border: 1px solid #f3f4f6;
        }
        .date {
            font-size: 13px;
            color: #6b7280;
            margin-bottom: 20px;
            font-weight: 600;
        }
        h2 {
            color: #0f4a3f;
            font-size: 20px;
            border-bottom: 2px solid #ecfdf5;
            padding-bottom: 8px;
            margin-top: 30px;
        }
        h3 {
            color: #111827;
            font-size: 15px;
            margin-top: 15px;
            margin-bottom: 5px;
        }
        p, li {
            font-size: 14px;
            color: #4b5563;
        }
        ul {
            padding-left: 20px;
        }
        li {
            margin-bottom: 8px;
        }
        .highlight-box {
            background-color: #fffbeb;
            border-left: 4px solid #f59e0b;
            padding: 15px 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .highlight-box p {
            margin: 0;
            color: #92400e;
            font-weight: 600;
        }
        .footer {
            text-align: center;
            padding: 30px 20px;
            color: #9ca3af;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>FIM</h1>
        <p>Financial Intelligence Manager</p>
    </div>
    <div class="container">
        <div class="date">
            Effective Date: June 20, 2026<br>
            Last Updated: June 28, 2026
        </div>
        
        <p>Welcome to FIM (Financial Intelligence Manager). By downloading, accessing, or using our mobile application, you agree to be bound by these Terms of Use. If you do not agree to these terms, please do not install or use the application.</p>
        
        <h2>1. Description of Service</h2>
        <p>FIM is a personal financial tracking, calculation, and planning application. The service allows users to manually log and organize their financial data, including EMI repayment schedules, monthly incomes, daily expenses, and savings goals.</p>
        
        <div class="highlight-box">
            <p>📊 Manual Bookkeeping: FIM does NOT disburse loans, facilitate credit, offer lending services, or connect to actual bank accounts. The "Mark paid" and "Record Payment" buttons are purely bookkeeping actions to help you keep track of your finances manually. No real-world money is transferred or processed by clicking these buttons.</p>
        </div>

        <h2>2. No Professional Advisory Disclaimer</h2>
        <p>All calculations, interest projections, repayment timelines, and responses generated by the <strong>"Ask FIM AI Assistant"</strong> (powered by Google Gemini) are simulations designed for informational and educational purposes only.</p>
        <p>FIM and Vignova Technologies are <strong>not</strong> registered financial planners, investment advisors, banks, brokers, or lenders. The metrics and recommendations shown in this app should not be treated as professional advice. You must consult a certified financial advisor before making any refinancing, prepayment, or investment decisions.</p>

        <h2>3. User Responsibilities & Account Security</h2>
        <p>By creating an account on FIM, you agree to the following terms:</p>
        <ul>
            <li><strong>Data Accuracy:</strong> You are solely responsible for entering accurate information regarding your loans, interest rates, incomes, and expenses. The accuracy of all schedules and AI insights depends entirely on the data you provide.</li>
            <li><strong>Credential Confidentiality:</strong> You must keep your account password and verification OTP confidential. Any activity that occurs under your account is your sole responsibility. If you suspect unauthorized access, you must notify us immediately.</li>
            <li><strong>Prohibited Use:</strong> You agree not to use the application to log fraudulent, misleading, or illegal data. You are prohibited from reverse-engineering, hacking, or attempting to compromise the security of the FIM servers or APIs.</li>
        </ul>

        <h2>4. Subscriptions & Premium Features</h2>
        <p>FIM offers optional premium features (such as FIM Premium) that provide unlimited tracking, advanced AI refinancing alerts, and unlimited chatbot queries.</p>
        <p>During local testing or review, payment gateways (like Razorpay) may run in <strong>sandbox/test mode</strong> where no real money is charged. When live subscriptions are enabled, billing terms, cancellation policies, and renewal schedules will be clearly displayed during checkout. You may cancel your subscription at any time.</p>

        <h2>5. Disclaimer of Warranties & Limitation of Liability</h2>
        <p>FIM is provided on an <strong>"as is"</strong> and <strong>"as available"</strong> basis, without warranties of any kind, either express or implied, including but not limited to the accuracy of interest calculations, amortization tables, or notification delivery times.</p>
        <p><strong>Limitation of Liability:</strong> In no event shall Vignova Technologies, its developers, or its partners be held liable for any direct, indirect, incidental, or special damages, including but not limited to:</p>
        <ul>
            <li>Interest penalties or late fees charged by your real-world lenders.</li>
            <li>Investment losses or decisions made based on the AI assistant’s advice.</li>
            <li>Data loss or calculation variances caused by server interruptions or bugs.</li>
        </ul>

        <h2>6. Governing Law & Jurisdiction</h2>
        <p>These Terms of Use are governed by and construed in accordance with the laws of India. Any legal claims, disputes, or litigation arising out of or in connection with the use of FIM shall be subject to the exclusive jurisdiction of the competent courts in India.</p>
        <p>If you have any questions regarding these terms, please contact us at:</p>
        <p>
            <strong>Vignova Technologies</strong><br>
            Email: <a href="mailto:vignova.official@gmail.com" style="color: #10b981; font-weight: bold; text-decoration: none;">vignova.official@gmail.com</a>
        </p>
    </div>
    <div class="footer">
        <p>© 2026 FIM. Secured with 256-bit encryption. Made in India 🇮🇳</p>
    </div>
</body>
</html>
"""
