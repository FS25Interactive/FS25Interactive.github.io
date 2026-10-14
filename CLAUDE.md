# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Landing page ("Interactive Maps") for the FS25 interactive map repos, plus the shared Supabase backend SQL and the cross-repo reference (`ARCHITECTURE.md` - read it first). Live: https://fs25interactive.github.io/ (org site `FS25Interactive`, so `base: '/'`).

## Commands

```bash
npm install       # first time (CI uses npm ci)
npm run dev       # Vite dev server
npm run build     # production build to dist/
npm run preview   # serve dist/ locally
```

No tests or linter. Verify by building and checking the 4 cards, links and cover images in a browser.

## Structure

- `index.html`, `src/main.js` - card grid driven by a `maps` array (`{name, desc, fields, kind, url, cover}`); add a map by adding an entry
- `src/styles/main.css` - Tailwind v4 + DaisyUI v5
- `public/covers/*.jpg` - card cover images
- `supabase/migrations/20260710120000_initial_schema.sql` - combined schema (CLI); `supabase_setup.sql` + `supabase_migration_*.sql` are the manual files actually applied to the live project, in order
- `.github/workflows/deploy.yml` - Pages deploy on push to `main`

## Do not

- Run `supabase db push` or alter seed rows / default map codes (`PolyOffice` on the live project, `''`/`Bubblegum1` seeds in SQL) unless the owner asks; their own login is in active use.
- Push hub content to the `legacy` remote (`keiranpoly2611.github.io`); it only serves a redirect.
- Rename internal "room" identifiers to "map"; the UI wording differs from internals on purpose.
