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

## Orientation

- `README.md` — what this project is and how the repo is laid out.
- `reference/README.md` — the Ars Magica rulebook text used as reference,
  and its CC-BY-SA licensing/attribution requirements.
- `reference/SCOPE-NOTES.md` — which rulebook chapters matter for the app.
- `reference/chunks/INDEX.md` — per-section reference lookup index.
- `docs/ROADMAP.md` — feature stages, in build order.
