/**
 * Covenant finances, from Covenants ch. 5 ("Wealth & Poverty").
 *
 * Everything here is a pure function over the stored wealth state, so the
 * arithmetic can be checked against the book without touching the UI. The
 * book's own formulas are quoted alongside each constant.
 *
 * All sums are in Mythic Pounds. One Mythic Pound is a pound of silver, the
 * annual income of a typical peasant, or a year's upkeep for an average
 * Hermetic laboratory.
 */

import type { BoonHook } from '../types.ts'

/** Inhabitant point costs differ between a young covenant and an established one. */
export type Season = 'spring-winter' | 'summer-autumn'

export type InhabitantKind =
  | 'magi'
  | 'companions'
  | 'specialists'
  | 'craftsmen'
  | 'grogs'
  | 'servants'
  | 'laborers'
  | 'teamsters'
  | 'dependents'
  | 'horses'

export type IncomeCategory = 'none' | 'lesser' | 'typical' | 'greater' | 'legendary'

export type LabUse = 'light' | 'typical' | 'heavy'

export interface IncomeSource {
  id: string
  label: string
  category: IncomeCategory
}

export interface Laboratory {
  id: string
  label: string
  /** Upkeep score; −5 is the lowest possible, there is no upper limit. */
  upkeep: number
  use: LabUse
}

export interface Wealth {
  season: Season
  inhabitants: Record<InhabitantKind, number>
  incomeSources: IncomeSource[]
  laboratories: Laboratory[]
  /** Total points of weapons and armor across the covenant. */
  weaponPoints: number
  /** Scribes, bookbinders and illuminators; each costs writing materials. */
  scribes: number
  /** Pennies paid daily to professional soldiers; 1 pound per penny per year. */
  soldierPenniesPerDay: number
  tithes: number
  inflation: number
}

/** Points of Inhabitants table. Horses cost 1 point in either season. */
const INHABITANT_POINTS: Record<Season, Record<InhabitantKind, number>> = {
  'spring-winter': {
    magi: 5,
    companions: 3,
    specialists: 2,
    craftsmen: 2,
    grogs: 1,
    servants: 1,
    laborers: 1,
    teamsters: 1,
    dependents: 1,
    horses: 1,
  },
  'summer-autumn': {
    magi: 10,
    companions: 5,
    specialists: 3,
    craftsmen: 3,
    grogs: 2,
    servants: 2,
    laborers: 2,
    teamsters: 2,
    dependents: 2,
    horses: 1,
  },
}

export const inhabitantLabels: Record<InhabitantKind, string> = {
  magi: 'Magi & nobles',
  companions: 'Companions',
  specialists: 'Specialists',
  craftsmen: 'Craftsmen',
  grogs: 'Grogs',
  servants: 'Servants',
  laborers: 'Laborers',
  teamsters: 'Teamsters',
  dependents: 'Dependents',
  horses: 'Horses',
}

/** Source of Income Categories table, with the Boon or Hook that grants each. */
export const incomeCategories: {
  id: IncomeCategory
  label: string
  pounds: number
  source: string
}[] = [
  { id: 'none', label: 'None', pounds: 0, source: 'Poverty (Major Hook)' },
  { id: 'lesser', label: 'Lesser', pounds: 40, source: 'Poverty (Minor Hook)' },
  { id: 'typical', label: 'Typical', pounds: 100, source: 'baseline' },
  { id: 'greater', label: 'Greater', pounds: 250, source: 'Wealth (Minor Boon)' },
  { id: 'legendary', label: 'Legendary', pounds: 1000, source: 'Wealth (Major Boon)' },
]

const INCOME_POUNDS: Record<IncomeCategory, number> = Object.fromEntries(
  incomeCategories.map((entry) => [entry.id, entry.pounds]),
) as Record<IncomeCategory, number>

/** Maintenance multipliers by how heavily a laboratory is used. */
const LAB_USE_MULTIPLIER: Record<LabUse, number> = { light: 0.5, typical: 1, heavy: 1.5 }

export const labUseLabels: Record<LabUse, string> = {
  light: 'Light (≤1 season/year)',
  typical: 'Typical (~2 seasons/year)',
  heavy: 'Heavy (3+ seasons/year)',
}

/** Points of Laboratories table for Upkeep −5 to +2. */
const LAB_POINTS_TO_UPKEEP_2: Record<number, number> = {
  [-5]: 1,
  [-4]: 2,
  [-3]: 3,
  [-2]: 5,
  [-1]: 7,
  0: 10,
  1: 15,
  2: 30,
}

/**
 * Points for one laboratory at a given Upkeep score. Up to +2 the table
 * applies; "beyond +2, the number of extra points gained per level of Upkeep
 * increase is equal to the new Upkeep score times ten".
 */
export function labPoints(upkeep: number): number {
  const score = Math.max(-5, Math.round(upkeep))
  if (score <= 2) return LAB_POINTS_TO_UPKEEP_2[score] ?? 1
  let points = LAB_POINTS_TO_UPKEEP_2[2]
  for (let level = 3; level <= score; level++) points += level * 10
  return points
}

export function pointsOfInhabitants(wealth: Wealth): number {
  const table = INHABITANT_POINTS[wealth.season]
  return (Object.keys(table) as InhabitantKind[]).reduce(
    (total, kind) => total + table[kind] * (wealth.inhabitants[kind] || 0),
    0,
  )
}

export function pointsOfLaboratories(wealth: Wealth): number {
  return wealth.laboratories.reduce(
    (total, lab) => total + labPoints(lab.upkeep) * LAB_USE_MULTIPLIER[lab.use],
    0,
  )
}

/**
 * The book's minimum staffing:
 *
 *   Servants: 2 for every 10 points of (all inhabitants, excluding laborers,
 *             servants and teamsters)
 *   Teamsters: 1 for every 10 points of (all inhabitants, excluding laborers
 *             and teamsters − [2 × number of laborers])
 *
 * "For every ten points" is read as rounding up, so that a covenant is never
 * left short-staffed by a part-block of points. The UI presents these as a
 * minimum to meet rather than enforcing them.
 */
export function requiredStaff(wealth: Wealth): { servants: number; teamsters: number } {
  const table = INHABITANT_POINTS[wealth.season]
  const excluded: InhabitantKind[] = ['laborers', 'servants', 'teamsters']
  const base = (Object.keys(table) as InhabitantKind[])
    .filter((kind) => !excluded.includes(kind))
    .reduce((total, kind) => total + table[kind] * (wealth.inhabitants[kind] || 0), 0)

  const servants = Math.ceil(base / 10) * 2
  const withServants = base + servants * table.servants
  const teamsterBase = withServants - 2 * (wealth.inhabitants.laborers || 0)
  const teamsters = Math.max(0, Math.ceil(teamsterBase / 10))
  return { servants, teamsters }
}

export interface ExpenseLine {
  id: string
  label: string
  pounds: number
  /** The book's rule, shown in the UI so a figure can be traced. */
  rule: string
}

/**
 * Fortifications Boons that add to the covenant's buildings cost 2 pounds
 * (Minor) or 5 (Major) a year. The book counts "only Boons that add to the
 * size, magnificence, or quantity of the covenant's buildings", which is a
 * judgment call, so this totals every selected Fortifications Boon and the UI
 * says so.
 */
export function fortificationUpkeep(selected: BoonHook[]): number {
  return selected
    .filter((option) => option.category === 'fortifications' && option.kind === 'boon')
    .reduce((total, option) => total + (option.magnitude === 'major' ? 5 : 2), 0)
}

export function expenditure(wealth: Wealth, selected: BoonHook[]): ExpenseLine[] {
  const points = pointsOfInhabitants(wealth)
  const blocks = points / 10
  const forts = fortificationUpkeep(selected)

  return [
    {
      id: 'buildings',
      label: 'Buildings',
      pounds: blocks * 1 + forts,
      rule: '1 lb per 10 points of inhabitants, plus 2 lb per Minor and 5 lb per Major Fortifications Boon',
    },
    {
      id: 'consumables',
      label: 'Consumables',
      pounds: blocks * 2,
      rule: '2 lb per 10 points of inhabitants',
    },
    {
      id: 'provisions',
      label: 'Provisions',
      pounds: blocks * 5,
      rule: '5 lb per 10 points of inhabitants',
    },
    {
      id: 'wages',
      label: 'Wages',
      pounds: blocks * 2 + wealth.soldierPenniesPerDay,
      rule: '2 lb per 10 points of inhabitants, plus 1 lb per penny paid daily to soldiers',
    },
    {
      id: 'laboratories',
      label: 'Laboratories',
      pounds: pointsOfLaboratories(wealth) / 10,
      rule: '1 lb per 10 points of laboratories',
    },
    {
      id: 'weapons',
      label: 'Weapons & armor',
      pounds: wealth.weaponPoints / 320,
      rule: '1 lb per 320 points of weapons and armor',
    },
    {
      id: 'writing',
      label: 'Writing materials',
      pounds: (wealth.inhabitants.magi || 0) + wealth.scribes,
      rule: '1 lb per magus, scribe, bookbinder and illuminator',
    },
    { id: 'tithes', label: 'Tithes', pounds: wealth.tithes, rule: 'Set by the covenant’s situation' },
    {
      id: 'inflation',
      label: 'Inflation',
      pounds: wealth.inflation,
      rule: 'Starts at 0, rising about 1 lb per 100 lb of expenditure each year',
    },
  ]
}

/**
 * Each laborer cuts Provisions by one pound, but laborers can save at most
 * half the Provisions total.
 */
export function laborerSaving(wealth: Wealth): number {
  const provisions = (pointsOfInhabitants(wealth) / 10) * 5
  return Math.min(wealth.inhabitants.laborers || 0, provisions / 2)
}

/**
 * Base income. The 100-pound Typical source assumes about six magi; the book
 * suggests 15 pounds per magus either side of that, or 6 pounds for a
 * covenant living on Lesser sources alone.
 */
export function income(wealth: Wealth): { base: number; magusAdjustment: number; total: number } {
  const base = wealth.incomeSources.reduce(
    (total, source) => total + INCOME_POUNDS[source.category],
    0,
  )
  const onlyLesser =
    wealth.incomeSources.length > 0 &&
    wealth.incomeSources.every((source) => source.category === 'lesser')
  const perMagus = onlyLesser ? 6 : 15
  const magusAdjustment = ((wealth.inhabitants.magi || 0) - 6) * perMagus
  return { base, magusAdjustment, total: base + magusAdjustment }
}

export interface Balance {
  income: number
  expenditure: number
  savings: number
  net: number
}

export function balanceSheet(wealth: Wealth, selected: BoonHook[]): Balance {
  const totalIncome = income(wealth).total
  const totalExpenditure = expenditure(wealth, selected).reduce(
    (total, line) => total + line.pounds,
    0,
  )
  const savings = laborerSaving(wealth)
  return {
    income: totalIncome,
    expenditure: totalExpenditure,
    savings,
    net: totalIncome - (totalExpenditure - savings),
  }
}

/** Pounds as the book writes them: whole where possible, else one decimal. */
export function formatPounds(pounds: number): string {
  const rounded = Math.round(pounds * 10) / 10
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}

/** Non-negative finite number, or the fallback. Guards imported/shared state. */
function safeNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? Math.min(value, 1_000_000)
    : fallback
}

/**
 * Rebuilds a Wealth from untrusted input (a shared link, an imported file, or
 * an older saved covenant) by starting from the defaults and accepting only
 * values that make sense.
 */
export function sanitizeWealth(input: unknown): Wealth {
  const base = emptyWealth()
  if (!input || typeof input !== 'object') return base
  const raw = input as Partial<Wealth>

  const inhabitants = { ...base.inhabitants }
  for (const kind of Object.keys(inhabitants) as InhabitantKind[]) {
    inhabitants[kind] = Math.floor(safeNumber(raw.inhabitants?.[kind], inhabitants[kind]))
  }

  const validCategories = new Set(incomeCategories.map((entry) => entry.id))
  const incomeSources = Array.isArray(raw.incomeSources)
    ? raw.incomeSources
        .filter((source) => source && validCategories.has(source.category))
        .slice(0, 20)
        .map((source, index) => ({
          id: String(source.id ?? index),
          label: String(source.label ?? 'Source').slice(0, 80),
          category: source.category,
        }))
    : base.incomeSources

  const laboratories = Array.isArray(raw.laboratories)
    ? raw.laboratories
        .filter((lab) => lab && lab.use in LAB_USE_MULTIPLIER)
        .slice(0, 50)
        .map((lab, index) => ({
          id: String(lab.id ?? index),
          label: String(lab.label ?? 'Laboratory').slice(0, 80),
          upkeep: Math.max(-5, Math.min(30, Math.round(Number(lab.upkeep) || 0))),
          use: lab.use,
        }))
    : base.laboratories

  return {
    season: raw.season === 'summer-autumn' ? 'summer-autumn' : 'spring-winter',
    inhabitants,
    incomeSources,
    laboratories,
    weaponPoints: Math.floor(safeNumber(raw.weaponPoints)),
    scribes: Math.floor(safeNumber(raw.scribes)),
    soldierPenniesPerDay: safeNumber(raw.soldierPenniesPerDay),
    tithes: safeNumber(raw.tithes),
    inflation: safeNumber(raw.inflation),
  }
}

export function emptyWealth(): Wealth {
  return {
    season: 'spring-winter',
    inhabitants: {
      magi: 6,
      companions: 0,
      specialists: 0,
      craftsmen: 0,
      grogs: 0,
      servants: 0,
      laborers: 0,
      teamsters: 0,
      dependents: 0,
      horses: 0,
    },
    incomeSources: [{ id: 'base', label: 'Principal source', category: 'typical' }],
    laboratories: [],
    weaponPoints: 0,
    scribes: 0,
    soldierPenniesPerDay: 0,
    tithes: 0,
    inflation: 0,
  }
}
