from django.core.management.base import BaseCommand

from cases.models import Case, DefenseDraft


class Command(BaseCommand):
    help = "Create non-sensitive sample cases and defense drafts for a product demo."

    def handle(self, *args, **options):
        samples = [
            {
                "internal_ref": "DEMO-001",
                "case_name": "شرکت نمونه آریا علیه جهاد دانشگاهی",
                "case_number": "1405-1001",
                "subject_category": "مطالبه وجه قرارداد خدمات",
                "authority_category": "شعبه نمونه دادگاه عمومی حقوقی تهران",
                "case_type": "legal",
                "classification": "normal",
                "financial_status": "financial",
                "amount": 850000000,
                "submitted_by": "organization",
                "case_status": "primary",
                "province": "تهران",
                "city": "تهران",
                "plaintiff_defendant": "خواهان: شرکت نمونه آریا\nخوانده: جهاد دانشگاهی",
                "description": "داده آزمایشی و فاقد اعتبار حقوقی برای نمایش سامانه.",
            },
            {
                "internal_ref": "DEMO-002",
                "case_name": "پرونده نمونه استخدامی",
                "case_number": "1405-1002",
                "subject_category": "استخدام و روابط کار",
                "authority_category": "هیئت نمونه تشخیص اداره کار",
                "case_type": "quasi_judicial",
                "classification": "confidential",
                "financial_status": "non_financial",
                "submitted_by": "other",
                "case_status": "primary",
                "province": "البرز",
                "city": "کرج",
                "plaintiff_defendant": "خواهان: شخص نمونه\nخوانده: جهاد دانشگاهی",
                "description": "داده آزمایشی و فاقد اعتبار حقوقی برای نمایش سامانه.",
            },
            {
                "internal_ref": "DEMO-003",
                "case_name": "اعتراض نمونه اداری",
                "case_number": "1405-1003",
                "subject_category": "اعتراض به تصمیم اداری",
                "authority_category": "شعبه نمونه دیوان عدالت اداری",
                "case_type": "administrative",
                "classification": "normal",
                "financial_status": "non_financial",
                "submitted_by": "other",
                "case_status": "primary",
                "province": "تهران",
                "city": "تهران",
                "plaintiff_defendant": "شاکی: شخص نمونه\nطرف شکایت: واحد سازمانی نمونه",
                "description": "داده آزمایشی و فاقد اعتبار حقوقی برای نمایش سامانه.",
            },
            {
                "internal_ref": "DEMO-004",
                "case_name": "پرونده نمونه نیازمند تکمیل",
                "case_number": "",
                "subject_category": "",
                "authority_category": "",
                "case_type": "legal",
                "classification": "normal",
                "financial_status": "financial",
                "submitted_by": "organization",
                "case_status": "primary",
                "province": "فارس",
                "city": "شیراز",
                "plaintiff_defendant": "",
                "description": "این پرونده عمداً ناقص است تا کارتابل اقدامات در دمو نمایش داده شود.",
            },
        ]

        created_cases = []
        for sample in samples:
            case, _ = Case.objects.update_or_create(
                internal_ref=sample["internal_ref"],
                defaults=sample,
            )
            created_cases.append(case)

        draft_samples = [
            (created_cases[0], 1, "پیش‌نویس دفاعیه قرارداد خدمات", "under_review"),
            (created_cases[1], 1, "پیش‌نویس دفاعیه پرونده استخدامی", "draft"),
            (created_cases[2], 1, "لایحه پاسخ به شکایت اداری", "approved"),
        ]

        for case, version, title, draft_status in draft_samples:
            DefenseDraft.objects.update_or_create(
                case=case,
                version=version,
                defaults={
                    "title": title,
                    "full_text": (
                        "ریاست محترم مرجع رسیدگی\n\n"
                        "با سلام و احترام\n\n"
                        "این متن صرفاً داده آزمایشی برای نمایش قابلیت ذخیره، ویرایش و بررسی "
                        "نسخه‌های لایحه در سامانه است و اعتبار حقوقی ندارد.\n\n"
                        "با احترام\nجهاد دانشگاهی"
                    ),
                    "structured_data": {
                        "claim_summary": "خلاصه آزمایشی ادعای طرف مقابل",
                        "defense_summary": "خلاصه آزمایشی موضع دفاعی",
                        "defense_arguments": ["محور دفاعی آزمایشی"],
                        "requested_relief": ["تقاضای آزمایشی از مرجع رسیدگی"],
                        "missing_information": [],
                        "review_notes": ["نیازمند بررسی کارشناس حقوقی"],
                        "full_text": "متن آزمایشی لایحه",
                    },
                    "status": draft_status,
                    "source_engine": "demo",
                    "model_name": "demo-seed",
                    "requires_legal_review": True,
                },
            )

        self.stdout.write(
            self.style.SUCCESS(
                "Demo data created. Run the command again safely to refresh it."
            )
        )
