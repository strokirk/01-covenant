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

## Stage 3 — Covenant Situations as presets ✅

The 18 ready-made covenant situations at the end of *Covenants* ch. 2, each
a themed package of Boons and Hooks, offered as one-click starting points
that populate the Stage 1 picker.

Two honesty notes surfaced in the UI rather than papered over:

- 128 of 149 package entries resolve to an option automatically. The rest
  are shorthand the lists spell differently, names ambiguous between two
  categories, or forms of governance that live in ch. 3 — these are listed
  for the reader to add by hand instead of being guessed at, since a wrong
  guess would silently corrupt the point balance.
- Four packages (Autumn Power, Swashbuckling, Traveling Covenant,
  Worshipful) do not tally as printed in the book. The picker shows the
  discrepancy rather than hiding it.

## Stage 4 — Wealth: income & expenditure ✅

*Covenants* ch. 5, as a yearly balance sheet: income sources by category,
inhabitants by covenfolk category (points differ by covenant season),
laboratories by Upkeep and use, and the expenditure categories that follow
from them. Fortifications Boons chosen in Stage 1 feed the Buildings line.

The arithmetic lives in `app/src/lib/wealth.ts` as pure functions, unit
tested against the book's own worked examples (`npm test`), including the
Upkeep +15 → 1200 points example and the stated identity that Buildings +
Consumables + Provisions + Wages comes to exactly 1 pound per point of
inhabitants.

Still to do here: cost saving from craftsmen, which is per-craft with a
limit per expenditure category. Laborers are done.

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
