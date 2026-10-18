"""Shared Gemini model fallback: models are tried in the order set in .env."""
import logging
import os

logger = logging.getLogger(__name__)

DEFAULT_MODEL = "gemini-3.6-flash"


class AllModelsFailed(RuntimeError):
    def __init__(self, errors):
        self.errors = errors
        super().__init__(" | ".join(errors))


def configured_models() -> list[str]:
    """Priority list from GEMINI_MODELS (comma-separated), else GEMINI_MODEL."""
    raw = os.getenv("GEMINI_MODELS") or os.getenv("GEMINI_MODEL") or DEFAULT_MODEL
    models = [m.strip() for m in raw.split(",") if m.strip()]
    return models or [DEFAULT_MODEL]


def create_interaction(client, **kwargs):
    """Call client.interactions.create on each configured model until one works.

    Returns (interaction, model_used). Raises AllModelsFailed if every model fails.
    """
    errors = []
    for model in configured_models():
        try:
            return client.interactions.create(model=model, **kwargs), model
        except Exception as exc:
            logger.warning("Gemini model %s failed: %s", model, exc)
            errors.append(f"{model}: {exc}")
    raise AllModelsFailed(errors)
