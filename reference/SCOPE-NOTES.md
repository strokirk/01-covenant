# Cursory scoping notes: which rulebook sections matter for the app

This is a first-pass triage (produced by a quick automated pass over each
book's table of contents, not a deep read) to guide what the covenant
builder should actually implement. Treat it as a starting point — verify
details against the source text as each feature is built.

## Directly relevant

### *Covenants* (the whole book is core material)
- **Chapter Two: Boons & Hooks** — the core covenant-building mechanic:
  Site, Fortifications, Resources, Residents, External Relations,
  Surroundings, and pre-built Covenant Situations.
- **Chapter Three: Governance** — forms of governance, council mechanics,
  Charter creation (oath, membership, rights, obligations, censure), and
  the Loyalty tracking system.
- **Chapter Four: Covenfolk** — servant/staff archetypes, magical
  alternatives (spells, enchanted items), fantastical/thematic covenfolk.
- **Chapter Five: Wealth & Poverty** — income and expenditure subsystems.
- **Chapter Six: Vis Sources** — 40+ example vis sources organized by
  Hermetic Art.
- **Chapter Seven: Library** — book manufacturing, manuscript types,
  library quality levels, the Hermetic book acquisition cycle.
- **Chapter Eight: Sanctum** — sanctum types, mundane/magical defenses.
- **Chapter Nine: Laboratories** — laboratory design, personalization
  rules, virtues/flaws, characteristics (size, refinement, safety, etc.).

### Core Rules (selective)
- **Chapter 6: Covenants** — "Aegis of the Hearth," covenant seasons,
  covenant situations, customized covenant creation, covenant finances,
  organization of covenfolk, the covenant in play.
- **Chapter 12: Realms** — vis sources touch point (fuller coverage lives
  in *Covenants* Chapter Six).

## Not relevant for v1 (safe to skip)

From Core Rules: Introduction; Order of Hermes (except the "Covenants"
section); Characters (individual magus/companion/grog creation);
Virtues and Flaws (character-level); Abilities; Hermetic Magic
(spellcasting rules); Laboratory (individual lab-work-in-a-season rules,
as opposed to *Covenants* Ch. 9's lab-design rules); Spells; Long Term
Events (advancement/aging/training); Obstacles (combat, encumbrance,
wounds, travel); Bestiary; Mythic Europe (setting/history — flavor
context, not a builder concern); Stories; Sagas.

## Needs a human look

- Core Rules Ch. 12 Realms (lines ~17448–17817) — realm types, auras,
  regiones. Unclear whether site selection should expose realm/aura
  choice directly or just use it as reference/flavor.
- Core Rules Ch. 6 "Customized Covenant Creation" (lines ~8061–8391) vs.
  *Covenants* Ch. Two (Boons & Hooks) — these look like they overlap or
  are two eras of the same system; confirm which is authoritative for
  this app (likely *Covenants*, being the dedicated, later sourcebook).
- *Covenants* Ch. Four "Magical Alternatives to Covenfolk" (spells,
  enchanted devices) — decide whether these are pickable options in the
  builder or just reference notes.

Line numbers above are approximate, from `Ars Magica 5e - Covenants.md`
and `Ars Magica - Definitive Edition (Core Rules).md` in this directory,
and will drift as those files are edited.
