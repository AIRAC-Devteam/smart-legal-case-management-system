"""Structured output schema for Gemini legal-notice extraction.

The schema contains both OCR-like fields copied from the notice and conservative
case-form classifications inferred from the visible document text.
"""


def nullable_string(description: str, *, enum: list[str] | None = None) -> dict:
    if enum:
        return {
            "description": description,
            "anyOf": [
                {"type": "string", "enum": enum},
                {"type": "null"},
            ],
        }
    return {
        "description": description,
        "anyOf": [
            {"type": "string"},
            {"type": "null"},
        ],
    }


GEMINI_RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        # Direct extraction from the notification
        "notification_number": nullable_string("شماره ابلاغیه، دقیقاً مطابق سند"),
        "case_number": nullable_string("شماره پرونده، دقیقاً مطابق سند"),
        "archive_number": nullable_string("شماره بایگانی"),
        "issue_date": nullable_string("تاریخ تنظیم یا صدور"),
        "first_name": nullable_string("نام مخاطب ابلاغیه"),
        "last_name": nullable_string("نام خانوادگی مخاطب ابلاغیه"),
        "national_id": nullable_string("شناسه/کد ملی مخاطب، فقط اگر صریحاً در سند آمده باشد"),
        "organization": nullable_string("نام مرجع یا سازمان قضایی صادرکننده"),
        "branch": nullable_string("نام کامل شعبه/مرجع رسیدگی"),
        "notification_type": nullable_string("نوع ابلاغیه/اخطاریه/احضاریه/دادخواست"),
        "hearing_date": nullable_string("تاریخ حضور یا جلسه، در صورت وجود"),
        "hearing_time": nullable_string("ساعت حضور یا جلسه، در صورت وجود"),
        "hearing_location": nullable_string("محل حضور یا جلسه، در صورت وجود"),
        "hearing_reason": nullable_string("علت حضور یا موضوع جلسه، در صورت وجود"),
        "notification_text": nullable_string("متن اصلی و قابل مشاهده ابلاغیه"),
        "issuer_name": nullable_string("نام صادرکننده/امضاکننده"),
        "issuer_role": nullable_string("سمت صادرکننده/امضاکننده"),
        "notification_date": nullable_string("تاریخ ابلاغ، اگر جدا از تاریخ صدور ذکر شده باشد"),
        "province": nullable_string("استان؛ فقط اگر از متن/نشانی/نام مرجع قابل تعیین باشد"),
        "city": nullable_string("شهر یا شهرستان؛ فقط اگر از متن/نشانی/نام مرجع قابل تعیین باشد"),

        # Parties
        "plaintiff": nullable_string(
            "خواهان/شاکی/درخواست‌کننده/تجدیدنظرخواه؛ شخص یا نهادی که دعوا را مطرح کرده است"
        ),
        "defendant": nullable_string(
            "خوانده/مشتکی‌عنه/طرف شکایت. اگر سند برای پاسخ یا حضور یک مخاطب صادر شده و طرف مقابل صریحاً مشخص نیست، مخاطبِ فراخوانده‌شده/مکلف به پاسخ را خوانده در نظر بگیر"
        ),

        # Fields used by the case-registration form
        "subject_category": nullable_string(
            "گروه‌بندی موضوعی کوتاه پرونده بر اساس موضوع دعوا؛ مانند استخدام، قرارداد، مطالبه وجه، مالیات، کار، خانواده"
        ),
        "case_type": nullable_string(
            "نوع دعوی. فقط یکی از مقادیر انگلیسی مجاز را برگردان: legal=حقوقی، criminal=کیفری، quasi_judicial=شبه قضایی، administrative=اداری",
            enum=["legal", "criminal", "quasi_judicial", "administrative"],
        ),
        "financial_status": nullable_string(
            "وضعیت مالی دعوی. financial فقط وقتی خواسته/موضوع اصلی ارزش یا مطالبه مالی مستقیم دارد؛ در غیر این صورت non_financial",
            enum=["financial", "non_financial"],
        ),
        "amount": nullable_string(
            "مبلغ خواسته به ریال فقط اگر صریحاً در سند وجود دارد؛ فقط رقم بدون جداکننده، ترجیحاً با ارقام لاتین"
        ),
        "submitted_by": nullable_string(
            "ماهیت شخصی که دعوا را مطرح کرده است: organization اگر خواهان/شاکی شرکت، سازمان، مؤسسه یا شخص حقوقی است؛ other اگر شخص حقیقی یا سایر موارد است",
            enum=["organization", "other"],
        ),
        "has_imprisonment": {
            "anyOf": [
                {"type": "boolean"},
                {"type": "null"},
            ],
            "description": (
                "آیا در موضوع/خواسته/اتهام این پرونده حبس یا مجازات سالب آزادی مطرح است؟ "
                "true فقط با قرینه روشن. برای پرونده روشنِ حقوقی/اداری بدون قرینه کیفری false. اگر قابل تعیین نیست null"
            ),
        },
        "case_status": nullable_string(
            "وضعیت دعوی: primary برای دعوای اصلی/دادخواست اصلی/بدوی؛ secondary فقط وقتی سند صریحاً پرونده یا دعوای فرعی/طاری/مرتبط را نشان می‌دهد. اگر نامشخص است null",
            enum=["primary", "secondary"],
        ),
        "classification": nullable_string(
            "طبقه‌بندی سند: confidential فقط اگر محرمانه/سری/طبقه‌بندی‌شده صریحاً درج شده؛ در غیر این صورت normal",
            enum=["normal", "confidential"],
        ),
        "document_type": nullable_string(
            "نوع سند قضایی",
            enum=[
                "notification",
                "petition",
                "judgment",
                "declaration",
                "defense_brief",
                "summons",
                "other",
            ],
        ),
        # Short reasons help human review; frontend may ignore these fields.
        "case_type_reason": nullable_string("دلیل کوتاه انتخاب نوع دعوی بر اساس متن سند"),
        "submitted_by_reason": nullable_string("دلیل کوتاه تشخیص سازمان/شرکت یا دیگری"),
        "imprisonment_reason": nullable_string("دلیل کوتاه تشخیص وجود یا عدم وجود حبس"),
        "party_reason": nullable_string("دلیل کوتاه تشخیص خواهان و خوانده"),
    },
    "required": [
        "notification_number", "case_number", "archive_number", "issue_date",
        "first_name", "last_name", "national_id", "organization", "branch",
        "notification_type", "hearing_date", "hearing_time", "hearing_location",
        "hearing_reason", "notification_text", "issuer_name", "issuer_role",
        "notification_date", "province", "city", "plaintiff", "defendant",
        "subject_category", "case_type", "financial_status", "amount",
        "submitted_by", "has_imprisonment", "case_status", "classification",
        "case_type_reason", "submitted_by_reason", "imprisonment_reason", "party_reason","document_type",
    ],
    "additionalProperties": False,
}
