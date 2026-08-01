# Smart Legal Case Management System

An AI-powered legal case management platform for automated judicial document processing, structured case registration, versioned defense-draft generation, and legal workflow monitoring.

## Main demo capabilities

- Upload legal images and PDF documents.
- Extract structured information with Gemini.
- Review and register confirmed case data.
- Generate defense briefs only after case creation.
- Automatically save every generated brief as a separate version.
- Edit drafts and move them through `draft`, `under_review`, `approved`, and `archived` states.
- Review all drafts from a central repository.
- Use the action inbox, lawsuits portfolio, and management reports for the demo.

## Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
python manage.py migrate
# Optional: create non-sensitive demo records
python manage.py seed_demo
python manage.py runserver
```

Configure `GEMINI_API_KEY` in `backend/.env`. Never commit that file.

## Frontend

```powershell
cd frontend
npm install
Copy-Item .env.example .env.local
npm run dev
```

Frontend: `http://localhost:5173`

Backend: `http://127.0.0.1:8000`

## Important API endpoints

- `POST /api/v1/documents/`
- `POST /api/v1/documents/{id}/extract/`
- `GET|POST /api/v1/cases/`
- `GET|PATCH|DELETE /api/v1/cases/{id}/`
- `POST /api/v1/cases/{id}/generate-defense/`
- `GET /api/v1/cases/{id}/defense-drafts/`
- `GET /api/v1/defense-drafts/`
- `GET|PATCH|DELETE /api/v1/defense-drafts/{id}/`

> AI-generated legal text is always a draft and requires review and approval by a qualified legal professional before official use.
