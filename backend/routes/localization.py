from fastapi import APIRouter, Depends, HTTPException, Query, Body
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from database import get_db
from models import Language, TranslationKey, TranslationValue, User
from dependencies import get_current_user

router = APIRouter(tags=["localization"])

INITIAL_LANGUAGES = [
    {"code": "en", "name": "English", "native_name": "English", "is_default": True, "is_active": True, "sort_order": 1},
    {"code": "hi", "name": "Hindi", "native_name": "हिन्दी", "is_default": False, "is_active": True, "sort_order": 2},
    {"code": "te", "name": "Telugu", "native_name": "తెలుగు", "is_default": False, "is_active": True, "sort_order": 3},
]

TRANSLATION_SEED = {
    # Auth & Common
    "app.name": {"en": "FIM", "hi": "FIM", "te": "FIM"},
    "app.subtitle": {"en": "Financial Intelligence & Smart EMI Manager", "hi": "वित्तीय बुद्धिमत्ता और स्मार्ट ईएमआई प्रबंधक", "te": "ఆర్థిక మేధస్సు & స్మార్ట్ EMI నిర్వాహకుడు"},
    "welcome.title": {"en": "Welcome to FIM", "hi": "FIM में आपका स्वागत है", "te": "FIMకి స్వాగతం"},
    "select.language": {"en": "Select Language", "hi": "भाषा चुनें", "te": "భాషను ఎంచుకోండి"},
    "continue": {"en": "Continue", "hi": "जारी रखें", "te": "కొనసాగించండి"},
    "sign.in": {"en": "Sign In", "hi": "साइन इन करें", "te": "సైన్ ఇన్"},
    "sign.up": {"en": "Sign Up", "hi": "साइन अप करें", "te": "సైన్ అప్"},
    "email": {"en": "Email Address", "hi": "ईमेल पता", "te": "ఇమెయిల్ చిరునామా"},
    "password": {"en": "Password", "hi": "पासवर्ड", "te": "పాస్‌వర్డ్"},
    "forgot.password": {"en": "Forgot Password?", "hi": "पासवर्ड भूल गए?", "te": "పాస్‌వర్డ్ మర్చిపోయారా?"},
    "remember.me": {"en": "Save Password", "hi": "पासवर्ड सहेजें", "te": "పాస్‌వర్డ్‌ను సేవ్ చేయండి"},
    
    # Bottom Navigation Tabs
    "nav.overview": {"en": "Overview", "hi": "डैशबोर्ड", "te": "డ్యాష్‌బోర్డ్"},
    "nav.expenses": {"en": "Expenses", "hi": "खर्च", "te": "లావాదేవీలు"},
    "nav.emis": {"en": "EMIs", "hi": "EMI", "te": "EMIలు"},
    "nav.savings": {"en": "Savings", "hi": "बचत", "te": "పొదుపులు"},
    "nav.insights": {"en": "AI Insights", "hi": "AI अंतर्दृष्टि", "te": "AI అంతర్దృష్టులు"},
    "nav.profile": {"en": "Profile", "hi": "प्रोफ़ाइल", "te": "ప్రొఫైల్"},

    # Dashboard & Financial Overview Metrics
    "dashboard.hub": {"en": "Your Financial Intelligence Hub", "hi": "आपका वित्तीय बुद्धिमत्ता केंद्र", "te": "మీ ఆర్థిక మేధస్సు కేంద్రం"},
    "dashboard.hello": {"en": "Hello", "hi": "नमस्ते", "te": "నమస్తే"},
    "total.net.balance": {"en": "Total Net Balance", "hi": "कुल नेट बैलेंस", "te": "మొత్తం నికర బ్యాలెన్స్"},
    "protected": {"en": "Protected", "hi": "सुरक्षित", "te": "రక్షించబడింది"},
    "monthly.income": {"en": "Monthly Income", "hi": "मासिक आय", "te": "నెలవారీ ఆదాయం"},
    "monthly.expenses": {"en": "Monthly Expenses", "hi": "मासिक खर्च", "te": "నెలవారీ ఖర్చులు"},
    "total.outstanding.debt": {"en": "Total Debt", "hi": "कुल बकाया ऋण", "te": "మొత్తం బకాయి రుణం"},
    "across.all.loans": {"en": "Across all loans", "hi": "सभी ऋणों पर", "te": "అన్ని రుణాలలో"},
    "monthly.emi.total": {"en": "Monthly EMI Due", "hi": "मासिक EMI बकाया", "te": "నెలవారీ EMI బకాయి"},
    "this.billing.cycle": {"en": "This billing cycle", "hi": "इस बिलिंग चक्र", "te": "ఈ బిల్లింగ్ చక్రం"},
    "accumulated.savings": {"en": "Accumulated Savings", "hi": "संचित बचत", "te": "సేకరించిన పొదుపు"},
    "safe.reserve": {"en": "Safe reserve", "hi": "सुरक्षित बचत", "te": "సురక్షిత నిల్వ"},
    "active.goals": {"en": "Active Goals", "hi": "सक्रिय लक्ष्य", "te": "క్రియాశీల లక్ష్యాలు"},
    "in.progress": {"en": "In progress", "hi": "प्रगति में", "te": "పురోగతిలో ఉంది"},
    "upcoming.emis": {"en": "Upcoming EMIs", "hi": "आगामी EMI", "te": "రాబోయే EMIలు"},
    "recent.activity": {"en": "Recent Activity", "hi": "हाल की गतिविधि", "te": "ఇటీవలి కార్యాచరణ"},
    "no.transactions": {"en": "No transactions yet. Start logging expenses or income!", "hi": "अभी कोई लेन-देन नहीं है। खर्च या आय दर्ज करना शुरू करें!", "te": "ఇంకా లావాదేవీలు లేవు. ఖర్చులు లేదా ఆదాయాన్ని నమోదు చేయడం ప్రారంభించండి!"},
    "health.score": {"en": "Financial Health Score", "hi": "वित्तीय स्वास्थ्य स्कोर", "te": "ఆర్థిక ఆరోగ్య స్కోరు"},

    # Actions & Buttons
    "add.loan": {"en": "Add Loan / EMI", "hi": "ऋण जोड़ें", "te": "రుణాన్ని జోడించండి"},
    "save.loan": {"en": "Save Loan Details", "hi": "ऋण विवरण सेव करें", "te": "రుణ వివరాలను సేవ్ చేయండి"},
    "add.transaction": {"en": "Add Expense / Income", "hi": "खर्च/आय जोड़ें", "te": "ఖర్చు/ఆదాయం జోడించండి"},
    "create.goal": {"en": "Create Custom Goal", "hi": "नया लक्ष्य बनाएं", "te": "కస్టమ్ లక్ష్యాన్ని సృష్టించండి"},
    "cancel": {"en": "Cancel", "hi": "रद्द करें", "te": "రద్దు చేయండి"},
    "save": {"en": "Save Changes", "hi": "सहेजें", "te": "సేవ్ చేయండి"},

    # EMIs & Loans
    "emis.title": {"en": "EMIs & Loans", "hi": "EMI और ऋण", "te": "EMIలు & రుణాలు"},
    "emis.subtitle": {"en": "Manage your loans and track all your EMI obligations", "hi": "अपने ऋणों का प्रबंधन करें और EMI दायित्वों को ट्रैक करें", "te": "మీ రుణాలను నిర్వహించండి మరియు EMI బాధ్యతలను ట్రాక్ చేయండి"},
    "total.monthly.obligation": {"en": "Total Monthly Obligation", "hi": "कुल मासिक दायित्व", "te": "మొత్తం నెలవారీ బాధ్యత"},
    "total.outstanding": {"en": "Total Outstanding", "hi": "कुल बकाया", "te": "మొత్తం బకాయి"},

    # Profile & Settings
    "profile.title": {"en": "My Profile & Settings", "hi": "प्रोफ़ाइल और सेटिंग्स", "te": "నా ప్రొఫైల్ & సెట్టింగ్‌లు"},
    "profile.subtitle": {"en": "Manage your profile, accounts & preferences", "hi": "अपनी प्रोफ़ाइल, खाते और प्राथमिकताएं प्रबंधित करें", "te": "మీ ప్రొఫైల్, ఖాతాలు & ప్రాధాన్యతలను నిర్వహించండి"},
    "settings.compliance": {"en": "Settings & Compliance", "hi": "सेटिंग्स और अनुपालन", "te": "సెట్టింగ్‌లు & వర్తింపు"},
    "language.preference": {"en": "App Language", "hi": "ऐप की भाषा", "te": "యాప్ భాష"},
    "language.preference_sub": {"en": "Change app language (English, हिन्दी, తెలుగు)", "hi": "ऐप की भाषा बदलें (English, हिन्दी, తెలుగు)", "te": "యాప్ భాషను మార్చండి (English, हिन्दी, తెలుగు)"},
    "privacy.policy": {"en": "Privacy Policy", "hi": "गोपनीयता नीति", "te": "గోప్యతా విధానం"},
    "terms.of.use": {"en": "Terms of Use", "hi": "उपयोग की शर्तें", "te": "వినియోగ నిబంధనలు"},
    "emi.reminders": {"en": "EMI Reminder Notifications", "hi": "EMI रिमाइंडर सूचनाएं", "te": "EMI రిమైండర్ నోటిఫికేషన్‌లు"},
    "sign.out": {"en": "Sign Out", "hi": "साइन आउट", "te": "సైన్ అవుట్"},
    "delete.account": {"en": "Delete Account", "hi": "खाता हटाएं", "te": "ఖాతాను తొలగించండి"},
}

def seed_localization_data(db: Session):
    """Seed initial languages and translation keys into DB if missing."""
    try:
        # Seed languages
        for lang_info in INITIAL_LANGUAGES:
            existing = db.query(Language).filter(Language.code == lang_info["code"]).first()
            if not existing:
                db.add(Language(**lang_info))
        db.commit()

        # Seed translation keys and values
        for key_str, vals in TRANSLATION_SEED.items():
            key_obj = db.query(TranslationKey).filter(TranslationKey.key == key_str).first()
            if not key_obj:
                module = key_str.split('.')[0] if '.' in key_str else 'common'
                key_obj = TranslationKey(key=key_str, module=module)
                db.add(key_obj)
                db.commit()
                db.refresh(key_obj)

            for lang_code, text_val in vals.items():
                val_obj = db.query(TranslationValue).filter(
                    TranslationValue.key_id == key_obj.id,
                    TranslationValue.language_code == lang_code
                ).first()
                if not val_obj:
                    db.add(TranslationValue(key_id=key_obj.id, language_code=lang_code, value=text_val))
        db.commit()
        print("[Localization] ✅ Dynamic localization seed verified.")
    except Exception as e:
        db.rollback()
        print(f"[Localization] ⚠️ Error seeding localization: {e}")

@router.get("/api/v1/languages")
def get_languages(db: Session = Depends(get_db)):
    """Returns list of active supported languages."""
    langs = db.query(Language).filter(Language.is_active == True).order_by(Language.sort_order.asc()).all()
    return JSONResponse([
        {
            "code": l.code,
            "name": l.name,
            "nativeName": l.native_name,
            "isDefault": l.is_default,
            "isActive": l.is_active
        }
        for l in langs
    ])

@router.get("/api/v1/translations")
def get_translations(language: str = Query("en"), db: Session = Depends(get_db)):
    """Returns key-value dictionary for requested language code (falls back to English)."""
    lang_code = language.lower().strip()
    
    # Query dictionary for target language
    rows = db.query(TranslationKey.key, TranslationValue.value).join(
        TranslationValue, TranslationKey.id == TranslationValue.key_id
    ).filter(TranslationValue.language_code == lang_code).all()

    dictionary = {r[0]: r[1] for r in rows}

    # Fallback to English for any missing keys
    if lang_code != "en":
        en_rows = db.query(TranslationKey.key, TranslationValue.value).join(
            TranslationValue, TranslationKey.id == TranslationValue.key_id
        ).filter(TranslationValue.language_code == "en").all()
        for key_str, val_str in en_rows:
            if key_str not in dictionary:
                dictionary[key_str] = val_str

    return JSONResponse({
        "language": lang_code,
        "translations": dictionary
    })

@router.patch("/api/v1/users/me/preferences")
def update_language_preference(
    payload: dict = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Updates user's preferred language in database."""
    lang_code = payload.get("preferredLanguage", "en").lower().strip()
    if lang_code not in ["en", "hi", "te"]:
        raise HTTPException(status_code=400, detail="Unsupported language code")

    current_user.preferred_language = lang_code
    db.commit()
    db.refresh(current_user)
    return JSONResponse({
        "status": "success",
        "preferredLanguage": current_user.preferred_language
    })
