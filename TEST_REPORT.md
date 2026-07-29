# Test Report

## Checks completed in the build environment

- Python syntax/AST check for all Backend `.py` files: PASS
- `python -m compileall backend`: PASS
- React/JavaScript/JSX parse check: PASS
- Frontend local import/export contract check: PASS
- CSS parse check: PASS
- Extraction JSON-schema property/required consistency: PASS
- Defense JSON-schema property/required consistency: PASS
- Frontend/Backend defense route contract check: PASS
- API client compatibility exports (`listCases`, `deleteCase`, `reextractDocument`, etc.): PASS
- Final package secret-file check (`.env`, development DB, media files): PASS

## Runtime tests included

`backend/cases/tests.py` contains smoke tests for:

- health endpoint
- PDF upload and mocked extraction
- Case CRUD
- defense generation from the Case endpoint

Run after dependency installation:

```powershell
cd backend
python manage.py test
```

## Environment limitation during packaging

The packaging sandbox did not provide the Python dependencies and its package registry was unavailable, so Django runtime tests and a live Gemini network call could not be executed here. The frontend archive originally contained Windows `node_modules`; those modules cannot perform a Linux Vite build because native Rollup binaries are platform-specific. `node_modules` is intentionally excluded from the final package. Run `npm install` on the target Windows machine, then `npm run build`.
