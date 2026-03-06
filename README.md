# SPEND — Offline Expense Planner (PWA)

Local‑first, offline expense planner you can install on your phone or desktop. Add and edit expense plans, get smart advice, take screenshots, view quick insights, and back up or restore your data — all without an internet connection.

## Live Demo
Deploys to GitHub Pages using Actions. After you push to `main`, your site will be available at:

```
https://johnbenet009.github.io/Spend-offline/
```

## Features
- Works completely offline (PWA) and is installable
- PIN lock (salted hash stored locally)
- Add, edit, delete with confirm modals
- Smart Spending Advice
- Screenshots for KPIs, plans, and advice
- Insights charts (completion donut + top items)
- Currency customization (name + symbol)
- Backup & Restore (export/import JSON)
- Confetti celebration when marking complete

## Getting Started
```bash
npm install
npm run dev
# typecheck/lint
npm run typecheck
npm run lint
```

## Build
```bash
npm run build
npm run preview
```

## Deploy to GitHub Pages (Actions)
This repo includes `.github/workflows/pages.yml`.

- Vite `base` is set to `/Spend-offline/` in `vite.config.ts`
- Workflow:
  - Builds on push to `main`
  - Uploads `dist` as Pages artifact
  - Deploys to GitHub Pages
  - Adds SPA fallback `dist/404.html`
- One‑time repo setup: Settings → Pages → “Build and deployment: GitHub Actions”

## Security
- PIN is stored as a salted SHA‑256 hash
- PIN and session are not included in backups
- All data stays on your device unless you export it

## Credit
Designed by [Positive Developer](https://wa.me/2349014532386)

## License
MIT

