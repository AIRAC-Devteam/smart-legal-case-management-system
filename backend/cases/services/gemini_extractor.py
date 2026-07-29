import base64
import json
import mimetypes
import os
from pathlib import Path

from google import genai

from .schema import GEMINI_RESPONSE_SCHEMA


class GeminiExtractionError(RuntimeError):
    pass


SUPPORTED_MIME_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
}


def _read_document(file_path: str) -> tuple[str, str]:
    path = Path(file_path)
    if not path.exists():
        raise GeminiExtractionError(f"فایل پیدا نشد: {file_path}")

    mime_type = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
    if mime_type not in SUPPORTED_MIME_TYPES:
        raise GeminiExtractionError(f"فرمت فایل پشتیبانی نمی‌شود: {mime_type}")

    encoded = base64.b64encode(path.read_bytes()).decode("utf-8")
    return encoded, mime_type


def _normalize_choice(value, allowed):
    return value if value in allowed else None


def _normalize_result(data: dict) -> dict:
    normalized = {
        key: data.get(key)
        for key in GEMINI_RESPONSE_SCHEMA["properties"]
    }

    normalized["case_type"] = _normalize_choice(
        normalized.get("case_type"),
        {"legal", "criminal", "quasi_judicial", "administrative"},
    )
    normalized["financial_status"] = _normalize_choice(
        normalized.get("financial_status"),
        {"financial", "non_financial"},
    )
    normalized["submitted_by"] = _normalize_choice(
        normalized.get("submitted_by"),
        {"organization", "other"},
    )
    normalized["case_status"] = _normalize_choice(
        normalized.get("case_status"),
        {"primary", "secondary"},
    )
    normalized["classification"] = _normalize_choice(
        normalized.get("classification"),
        {"normal", "confidential"},
    ) or "normal"
    normalized["document_type"] = _normalize_choice(
        normalized.get("document_type"),
        {
            "notification",
            "petition",
            "judgment",
            "declaration",
            "defense_brief",
            "summons",
            "other",
        },
    )

    if normalized.get("has_imprisonment") not in {True, False, None}:
        normalized["has_imprisonment"] = None

    amount = normalized.get("amount")
    if amount is not None:
        digit_map = str.maketrans(
            "۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩",
            "01234567890123456789",
        )
        amount_ascii = str(amount).translate(digit_map)
        amount_ascii = "".join(ch for ch in amount_ascii if ch.isdigit())
        normalized["amount"] = amount_ascii or None

    return normalized


def extract_notice_with_gemini(file_path: str) -> dict:
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        raise GeminiExtractionError(
            "GEMINI_API_KEY تنظیم نشده است. فایل backend/.env را بررسی کنید."
        )

    model = os.getenv("GEMINI_MODEL", "gemini-3.6-flash").strip()
    file_base64, mime_type = _read_document(file_path)

    prompt = """
You are a document-reading and structured legal-case extraction engine for Iranian
judicial documents such as electronic notices, petitions, judgments, declarations,
summonses and related legal documents.

Read the full visible document faithfully and conservatively classify only what can
be supported by the document.

Rules:
1. Never invent case numbers, national IDs, dates, names, amounts, addresses, legal
   facts, statutes, or relationships.
2. Return null for absent, redacted, unreadable, or genuinely uncertain fields.
3. Preserve Persian names and legal text as visible. Preserve identifiers as strings.
4. plaintiff is the initiating party: خواهان / شاکی / درخواست‌کننده / تجدیدنظرخواه.
5. defendant is the opposing party: خوانده / مشتکی‌عنه / طرف شکایت. When the notice
   sends an initiating party's claim to an addressee and requires that addressee to
   answer or appear, treat the addressee as defendant when supported by context.
6. case_type may only be legal, criminal, quasi_judicial, or administrative.
7. submitted_by describes the initiating party: organization for a legal entity,
   otherwise other.
8. financial_status is financial only when the main claim is directly monetary or
   has an explicit monetary value; otherwise non_financial when clearly determinable.
9. has_imprisonment is true only with clear custodial/imprisonment evidence; false for
   clearly civil/administrative matters without such evidence; otherwise null.
10. case_status is primary for a main/original proceeding and secondary only when an
    explicit ancillary/related/secondary proceeding is shown.
11. classification is confidential only when the document explicitly says so;
    otherwise normal.
12. amount is the claim amount in RIAL only when explicitly stated. Return digits only.
13. province/city may be inferred from an explicit court/branch/address, not from
    unrelated assumptions.
14. *_reason fields must briefly state the textual basis for the classification.
15. document_type should classify the document itself using the allowed enum.
""".strip()

    if mime_type == "application/pdf":
        media_part = {
            "type": "document",
            "data": file_base64,
            "mime_type": mime_type,
        }
    else:
        media_part = {
            "type": "image",
            "data": file_base64,
            "mime_type": mime_type,
        }

    try:
        client = genai.Client(api_key=api_key)
        interaction = client.interactions.create(
            model=model,
            input=[
                {"type": "text", "text": prompt},
                media_part,
            ],
            response_format={
                "type": "text",
                "mime_type": "application/json",
                "schema": GEMINI_RESPONSE_SCHEMA,
            },
        )
    except Exception as exc:
        raise GeminiExtractionError(f"Gemini API error: {exc}") from exc

    content = interaction.output_text
    if not content:
        raise GeminiExtractionError("Gemini پاسخ متنی برنگرداند.")

    try:
        data = json.loads(content)
    except json.JSONDecodeError as exc:
        raise GeminiExtractionError("پاسخ Gemini JSON معتبر نبود.") from exc

    if not isinstance(data, dict):
        raise GeminiExtractionError("ساختار پاسخ Gemini معتبر نبود.")

    return _normalize_result(data)
