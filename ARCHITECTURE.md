# Architecture

```text
┌──────────────────────────────────────┐
│ React / Vite                         │
│ - Upload document                    │
│ - Review/edit extracted fields       │
│ - Cases list/details                 │
│ - Review/edit defense draft          │
└──────────────────┬───────────────────┘
                   │ REST API
                   ▼
┌──────────────────────────────────────┐
│ Django + DRF                         │
│ - Document API                       │
│ - Case CRUD API                      │
│ - Defense action on confirmed Case   │
│ - Validation                         │
└──────────────┬───────────────┬───────┘
               │               │
               ▼               ▼
       SQLite / media       Gemini API
                           ┌──────┴──────┐
                           ▼             ▼
                      Extraction     Defense draft
```

## Human-in-the-loop

Extraction output is not treated as the final legal record. It fills an editable Case form. The operator reviews and corrects the form before `POST /api/v1/cases/` creates the Case.

Defense generation is intentionally attached to the Case endpoint:

```text
POST /api/v1/cases/{id}/generate-defense/
```

The backend reloads the confirmed Case from the database and combines it with the stored `notification_data`. Therefore unsaved frontend state is never treated as the official source for the defense draft.

## Data flow

```text
Document upload
  → Document record
  → Gemini structured extraction
  → Editable form
  → Confirmed Case record
  → Gemini defense generation
  → Editable defense draft
```

## Gemini-only service layer

```text
cases/services/extraction.py
    └── gemini_extractor.py

cases/services/defense_generator.py
    └── defense_schema.py
```

Legacy OpenAI, Ollama and local OCR extraction paths are not part of this version.

## Production hardening

The current DRF permission is `AllowAny` for development. Before deployment on real legal documents add authentication/RBAC, protected file delivery, audit logging, HTTPS, backups, rate limiting, and a reviewed data-retention policy.
