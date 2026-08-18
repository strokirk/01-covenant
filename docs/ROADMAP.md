# Roadmap

Features in build order, simplest first. Each stage should be shippable on
its own — the app stays useful and deployable at the end of every stage.

## Stage 1 — Boons & Hooks picker ✅

The heart of covenant creation (*Covenants* ch. 2). Pick options across the
six categories; the app tracks the point balance.

- Rules: Major = 3 points, Minor = 1 point, Free Choices = 0. A player
  covenant balances when total Boon points equal total Hook points.
- 201 options extracted to `app/src/data/boons-hooks.json`.
- UI: browse by category, filter boon/hook, select/deselect, running
  balance, repeat counts for options that may be taken more than once
  (e.g. Minor Aura up to 7×).
- Persistence: localStorage.

## Stage 2 — Saved state, export & sharing ✅

Name the covenant, export/import it as JSON, and share it by link. The
covenant is encoded into the URL hash, so a shared link reconstructs it
with no server involved; a link takes priority over locally saved work.

## Stage 3 — Covenant Situations as presets

*Covenants* ch. 2 ends with ~18 ready-made covenant situations, each a
themed bundle of Boons and Hooks. Offer them as one-click starting points
that populate the Stage 1 picker.

## Stage 4 — Wealth: income & expenditure

*Covenants* ch. 5. Income sources, covenfolk categories, yearly expenditure
categories, cost savings. Produces a yearly balance sheet — the most
calculation-heavy part of the book, so it needs Stage 1's data model settled
first.

## Stage 5 — Library

*Covenants* ch. 7. Books as summae/tractatus with Level and Quality, shelf
listing, totals.

## Stage 6 — Vis sources

*Covenants* ch. 6. Pick or define sources by Art and annual yield.

## Stage 7 — Laboratories & sanctum

*Covenants* ch. 9 (large: size, refinement, safety, warping, plus lab
virtues/flaws) and ch. 8.

## Stage 8 — Governance & charter

*Covenants* ch. 3. Charter builder from the book's play-aid template.

## Stage 9 — Output

Printable / exportable covenant sheet pulling every stage together.

## Cross-cutting

- Attribution: any rules text shown in the app must carry the CC-BY-SA
  attribution to Atlas Games (see `reference/README.md`).
- Rule data is extracted from the source books by scripts in `scripts/`
  rather than hand-typed, so it stays auditable.
