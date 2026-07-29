DEFENSE_RESPONSE_SCHEMA = {
    "type": "object",

    "properties": {
        "title": {
            "type": "string",
            "description": "عنوان رسمی لایحه دفاعیه",
        },

        "authority": {
            "anyOf": [{"type": "string"}, {"type": "null"}],
            "description": "مرجع رسیدگی مانند شعبه دادگاه یا دیوان",
        },

        "case_number": {
            "anyOf": [{"type": "string"}, {"type": "null"}],
            "description": "شماره پرونده",
        },

        "plaintiff": {
            "anyOf": [{"type": "string"}, {"type": "null"}],
            "description": "خواهان یا شاکی",
        },

        "defendant": {
            "anyOf": [{"type": "string"}, {"type": "null"}],
            "description": "خوانده یا طرف شکایت",
        },

        "subject": {
            "anyOf": [{"type": "string"}, {"type": "null"}],
            "description": "موضوع پرونده",
        },

        "claim_summary": {
            "type": "string",
            "description": "خلاصه ادعا یا خواسته طرف مقابل",
        },

        "defense_summary": {
            "type": "string",
            "description": "خلاصه موضع دفاعی جهاد دانشگاهی",
        },

        "defense_arguments": {
            "type": "array",
            "items": {
                "type": "string",
            },
            "description": "محورهای اصلی دفاع",
        },

        "requested_relief": {
            "type": "array",
            "items": {
                "type": "string",
            },
            "description": "خواسته‌های پیشنهادی از مرجع رسیدگی",
        },

        "missing_information": {
            "type": "array",
            "items": {
                "type": "string",
            },
            "description": "اطلاعات یا اسناد موردنیاز برای تکمیل دفاع",
        },

        "full_text": {
            "type": "string",
            "description": "متن کامل و رسمی پیش‌نویس لایحه دفاعیه به فارسی",
        },

        "review_notes": {
            "type": "array",
            "items": {
                "type": "string",
            },
            "description": "مواردی که کارشناس حقوقی باید قبل از استفاده بررسی کند",
        },
    },

    "required": [
        "title",
        "authority",
        "case_number",
        "plaintiff",
        "defendant",
        "subject",
        "claim_summary",
        "defense_summary",
        "defense_arguments",
        "requested_relief",
        "missing_information",
        "full_text",
        "review_notes",
    ],

    "additionalProperties": False,
}