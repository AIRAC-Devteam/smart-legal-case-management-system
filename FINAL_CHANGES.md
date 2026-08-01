# Final Changes

## Defense draft persistence

- Added the `DefenseDraft` Backend model.
- Every successful AI generation is saved automatically.
- Versions increment independently for each Case.
- Drafts support `draft`, `under_review`, `approved`, and `archived` statuses.
- Added central list, edit, filter and delete APIs.
- Added version history and save controls to the Case details page.
- Added a dedicated `پیش‌نویس لوایح` repository page.

## Demo-ready sections

- Live home dashboard
- My Inbox derived from real case/draft state
- Lawsuits portfolio
- Management reports
- Help and demo guide
- Polished overview pages for contracts, properties and databanks
- Optional `python manage.py seed_demo` command

## Sidebar UI

The selected vertical arrangement and logo remain unchanged. Improvements include:

- consistent icon containers
- clearer active state
- smoother hover behavior
- AI badge for defense drafts
- controlled scrolling
- fixed footer
- responsive collapsed and mobile states

## Required migration

```powershell
cd backend
python manage.py migrate
```
