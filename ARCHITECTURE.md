# Architecture

```text
┌──────────────────────────────────────────────┐
│ React / Vite                                 │
│ - Upload and review legal documents          │
│ - Register and edit confirmed cases          │
│ - Generate and edit defense drafts           │
│ - Central draft repository and version history│
│ - Inbox, lawsuits portfolio and reports      │
└──────────────────────┬───────────────────────┘
                       │ REST API
                       ▼
┌──────────────────────────────────────────────┐
│ Django + Django REST Framework               │
│ - Document upload/extraction API             │
│ - Case CRUD API                              │
│ - Defense generation on confirmed Case       │
│ - Versioned DefenseDraft CRUD API            │
└───────────────┬───────────────────┬──────────┘
                │                   │
                ▼                   ▼
       SQLite / media          Gemini API
       Case + Drafts      Extraction + generation
```

## Human-in-the-loop flow

```text
Document upload
  → Gemini structured extraction
  → editable review form
  → confirmed Case record
  → Gemini defense generation
  → automatically saved DefenseDraft version
  → legal review / editing / approval
```

The generation endpoint is attached to an existing Case:

```text
POST /api/v1/cases/{id}/generate-defense/
```

The Backend reloads the confirmed Case from the database. Unsaved frontend state is never treated as the official source for the generated defense draft.

## Versioned defense drafts

Every successful generation creates a new `DefenseDraft` row. Previous versions remain available.

```text
Case 1
 ├── DefenseDraft v1 — draft
 ├── DefenseDraft v2 — under_review
 └── DefenseDraft v3 — approved
```

Draft statuses:

- `draft`
- `under_review`
- `approved`
- `archived`

## Gemini-only service layer

```text
cases/services/extraction.py
    └── gemini_extractor.py

cases/services/defense_generator.py
    └── defense_schema.py
```

## Optional demo data

After migration, populate non-sensitive sample data:

```powershell
python manage.py seed_demo
```

## Production hardening

The current MVP uses `AllowAny`. Before using real legal documents in production, add authentication and RBAC, protected file delivery, audit logging, HTTPS, backups, rate limiting, secret management, encrypted storage where required, and a reviewed retention policy.
