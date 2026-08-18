# Agent instructions

## Push straight to main

Do not create feature branches or hold changes for review. As soon as a
change is in a good state (typecheck passes, build succeeds), commit it
and push straight to `main`.

## Commit eagerly

Commit working increments as soon as they pass validation, rather than
batching changes. Sessions run against a usage quota and can get cut off
mid-task — uncommitted or unpushed work at that point is lost.

Each pushed commit must still be coherent and functional: typecheck clean,
build succeeding. Don't commit broken code, and don't sit on finished work
waiting to bundle it with something later.

## Validation

After changing anything under `app/src/`, run:

```sh
cd app && npm run typecheck && npm run build
```

There is also an end-to-end smoke test covering the balance arithmetic,
persistence, sharing and the situation presets. Playwright is not a saved
dependency (the Pages workflow runs `npm ci`, and pulling browsers there
would cost minutes per deploy for a check CI does not run):

```sh
cd app && npm run preview &        # serves /01-covenant/
npm i -D playwright --no-save
npm run smoke                      # CHROMIUM_PATH=... to reuse a browser
```

## Code layout

- `app/src/styles/` — tokens, base, shared controls, page layout. Imported
  by `index.css`.
- `app/src/components/` — one `.tsx` and its own `.css` per component.
- `app/src/components/ui/` — shared primitives (`Button`, `Badge`). Prefer
  these over restyling a bare `<button>` or `<span>`.
- `app/src/lib/` — pure helpers.
- `scripts/` — reference splitting and rule-data extraction. Rule data is
  derived from the books by script, never typed by hand, so it stays
  auditable; regenerate rather than editing `app/src/data/*.json`.

## Orientation

- `README.md` — what this project is and how the repo is laid out.
- `reference/README.md` — the Ars Magica rulebook text used as reference,
  and its CC-BY-SA licensing/attribution requirements.
- `reference/SCOPE-NOTES.md` — which rulebook chapters matter for the app.
- `reference/chunks/INDEX.md` — per-section reference lookup index.
- `docs/ROADMAP.md` — feature stages, in build order.
