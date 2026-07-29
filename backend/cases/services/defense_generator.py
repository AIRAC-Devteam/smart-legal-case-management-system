import json
import os

from google import genai

from .defense_schema import DEFENSE_RESPONSE_SCHEMA


class DefenseGenerationError(RuntimeError):
    pass


def generate_defense_brief(
    extracted_data: dict,
    case_data: dict | None = None,
) -> dict:
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        raise DefenseGenerationError("GEMINI_API_KEY تنظیم نشده است.")

    model = os.getenv("GEMINI_MODEL", "gemini-3.6-flash").strip()
    source_data = {
        "confirmed_case": case_data or {},
        "extracted_document": extracted_data or {},
    }

    prompt = f"""
شما دستیار تهیه «پیش‌نویس لایحه دفاعیه» برای واحد حقوقی جهاد دانشگاهی هستید.

داده‌های زیر شامل اطلاعات تأییدشده پرونده در سامانه و داده‌های استخراج‌شده از سند
قضایی هستند. اطلاعات تأییدشده پرونده را در صورت تعارض، مبنای اصلی قرار بده.

داده‌ها:
{json.dumps(source_data, ensure_ascii=False, indent=2)}

قواعد قطعی:
1. فقط از اطلاعات موجود در داده‌های ورودی استفاده کن.
2. هیچ نام، تاریخ، شماره، مبلغ، قرارداد، نامه، واقعه، دلیل، مدرک، ماده قانونی، رأی،
   بخشنامه یا استناد حقوقی را اختراع نکن.
3. خواهان/شاکی و خوانده/طرف شکایت را جابه‌جا نکن.
4. ادعا یا خواسته طرف مقابل را منصفانه و دقیق خلاصه کن.
5. دفاع را فقط بر پایه اطلاعات و مستندات موجود بنویس.
6. هر موضوعی که برای دفاع نیاز به سند یا اطلاعات بیشتری دارد، در missing_information
   قرار بده.
7. استنادهای قانونی نامطمئن را وارد متن قطعی نکن و در review_notes با عبارت
   «نیازمند بررسی کارشناس حقوقی» مشخص کن.
8. full_text باید رسمی، فارسی، قابل ویرایش و صریحاً یک پیش‌نویس باشد.
9. متن پیشنهادی full_text این ساختار را داشته باشد:
   ریاست محترم مرجع رسیدگی
   با سلام و احترام
   موضوع: ...
   شرح مختصر موضوع
   دفاعیات
   نتیجه‌گیری و تقاضا
   با احترام
   جهاد دانشگاهی
10. خروجی نباید وانمود کند که توسط وکیل یا مسئول حقوقی تأیید شده است.
""".strip()

    try:
        client = genai.Client(api_key=api_key)
        interaction = client.interactions.create(
            model=model,
            input=prompt,
            response_format={
                "type": "text",
                "mime_type": "application/json",
                "schema": DEFENSE_RESPONSE_SCHEMA,
            },
        )
    except Exception as exc:
        raise DefenseGenerationError(
            f"Gemini API error while generating defense brief: {exc}"
        ) from exc

    content = interaction.output_text
    if not content:
        raise DefenseGenerationError("Gemini متن لایحه دفاعیه تولید نکرد.")

    try:
        result = json.loads(content)
    except json.JSONDecodeError as exc:
        raise DefenseGenerationError("پاسخ تولید لایحه JSON معتبر نبود.") from exc

    if not isinstance(result, dict):
        raise DefenseGenerationError("ساختار پاسخ تولید لایحه معتبر نبود.")

    return result
