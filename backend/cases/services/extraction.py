from .gemini_extractor import extract_notice_with_gemini


def extract_document(file_path: str):
    data = extract_notice_with_gemini(file_path)
    raw_text = data.get("notification_text") or ""
    return data, raw_text, "gemini"
