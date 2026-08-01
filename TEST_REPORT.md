# Test Report

## Static checks completed

- Python source compilation for all Backend files: **PASS**
- React/JavaScript/JSX parse using the TypeScript parser: **PASS**
- Frontend relative-import resolution: **PASS**
- API client named export/import contract: **PASS**
- CSS parse with `tinycss2`: **PASS**
- Frontend/Backend defense-generation route contract: **PASS**
- DefenseDraft router, model creation path and migration presence: **PASS**
- Git whitespace/error check: **PASS**

## Backend runtime tests included

`backend/cases/tests.py` covers:

- health endpoint
- PDF upload with mocked Gemini extraction
- Case CRUD
- automatic saving of every generated defense draft
- incrementing version numbers per Case
- draft filtering by Case
- editing draft text and review status

Run locally after dependencies are installed:

```powershell
cd backend
python manage.py migrate
python manage.py test
```

## Frontend build

Run locally after dependency installation:

```powershell
cd frontend
npm install
npm run build
```

## Packaging-environment limitation

The build sandbox package registries did not provide the required Django or npm packages, so live Django tests, a Vite production build, and a real Gemini call could not be executed in this environment. The project includes runtime tests and passed syntax, route-contract, import/export, CSS, and package-content checks. `node_modules`, `.env`, the development database, uploaded media, and `.git` are intentionally excluded from the final archive.
