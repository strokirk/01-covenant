import type { Wealth } from './lib/wealth.ts'

/** Boon and Hook magnitudes. Free Choices cost nothing and never unbalance. */
export type Magnitude = 'major' | 'minor' | 'free'

/** A Free Choice is neither Boon nor Hook, so it gets its own kind. */
export type Kind = 'boon' | 'hook' | 'free'

/** The six Boon/Hook categories of Covenants chapter two. */
export type CategoryId =
  | 'site'
  | 'fortifications'
  | 'resources'
  | 'residents'
  | 'external-relations'
  | 'surroundings'

/** One selectable option, extracted from the book by scripts/extract-boons-hooks.mjs. */
export interface BoonHook {
  id: string
  name: string
  category: CategoryId
  categoryLabel: string
  kind: Kind
  magnitude: Magnitude
  /** Major = 3, Minor = 1, Free Choice = 0. */
  points: number
  /** Prerequisite noted in the book, e.g. "requires Castle". */
  qualifier?: string
  /** How many times the option may be taken; 1 unless the text says otherwise. */
  maxTimes: number
  description: string
  source: { book: string; chunk: string; line: number }
}

/** The covenant under construction. Selections map an option id to its count. */
export interface Covenant {
  name: string
  selections: Record<string, number>
  wealth: Wealth
}

/** One line of a Covenant Situation's package, as the book writes it. */
export interface SituationEntry {
  /** The name as printed, including any specialization after a colon. */
  name: string
  specialization?: string
  magnitude: Magnitude | null
  kind: Kind
  count: number
  /**
   * The option this line refers to, or null where the book's shorthand is
   * ambiguous, disagrees with the lists, or names something from another
   * chapter (the forms of governance live in chapter three).
   */
  optionId: string | null
}

/** A ready-made package of Boons and Hooks from Covenants chapter two. */
export interface Situation {
  id: string
  name: string
  description: string
  entries: SituationEntry[]
  boonPoints: number
  hookPoints: number
}
