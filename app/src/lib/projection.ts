/**
 * Year-on-year growth and decline, from Covenants ch. 5 (Income →
 * Improvement, and the Inflation expenditure category).
 *
 * Each year the storyguide picks an effect from the Income Modification
 * table and applies its multiplier to that year's income. "Such changes are
 * usually permanent, adjusting the base income for all subsequent years", so
 * the multipliers compound — five years of Expansion turns a Typical source
 * into something like a Greater one.
 */

export type ModifierId =
  | 'slump'
  | 'contraction'
  | 'stagnation'
  | 'status-quo'
  | 'growth'
  | 'expansion'
  | 'boom'

/** Income Modification table, with the stress die result that would roll it. */
export const incomeModifiers: {
  id: ModifierId
  label: string
  multiplier: number
  die: string
}[] = [
  { id: 'slump', label: 'Slump', multiplier: 0.5, die: 'botch' },
  { id: 'contraction', label: 'Contraction', multiplier: 0.8, die: '0' },
  { id: 'stagnation', label: 'Stagnation', multiplier: 0.95, die: '2' },
  { id: 'status-quo', label: 'Status Quo', multiplier: 1, die: '3–8' },
  { id: 'growth', label: 'Growth', multiplier: 1.05, die: '9' },
  { id: 'expansion', label: 'Expansion', multiplier: 1.2, die: '10–19' },
  { id: 'boom', label: 'Boom', multiplier: 1.5, die: '20+' },
]

const multiplierOf = (id: ModifierId): number =>
  incomeModifiers.find((entry) => entry.id === id)?.multiplier ?? 1

export interface ProjectionInput {
  /** Income in year zero, before any modifier. */
  baseIncome: number
  /** Yearly expenditure excluding inflation, after cost savings. */
  baseExpenditure: number
  /** Inflation already being paid; zero in a covenant's first year. */
  startingInflation: number
  /** Silver in the covenant's stores at the start. */
  startingStores: number
  /** One entry per year projected. */
  modifiers: ModifierId[]
}

export interface ProjectionYear {
  year: number
  modifier: ModifierId
  income: number
  inflation: number
  expenditure: number
  net: number
  stores: number
}

/**
 * Inflation "increase[s] by one pound per hundred pounds of expenditure every
 * year", and "not increase during a year in which the covenant's expenditure
 * drops". Expenditure here is static apart from inflation itself, so it only
 * ever rises — the drop case is left to the reader adjusting the figures.
 */
export function project(input: ProjectionInput): ProjectionYear[] {
  const years: ProjectionYear[] = []
  let income = input.baseIncome
  let inflation = input.startingInflation
  let stores = input.startingStores

  for (const [index, modifier] of input.modifiers.entries()) {
    if (index > 0) {
      const previous = years[index - 1]
      inflation = previous.inflation + previous.expenditure / 100
    }
    income = income * multiplierOf(modifier)
    const expenditure = input.baseExpenditure + inflation
    const net = income - expenditure
    stores += net
    years.push({ year: index + 1, modifier, income, inflation, expenditure, net, stores })
  }
  return years
}

/**
 * The first year in which stores cover a one-off outlay, or null if the
 * projection never reaches it. Useful for asking when a covenant can afford
 * the castle it has been planning.
 */
export function yearAffordable(years: ProjectionYear[], cost: number): number | null {
  return years.find((entry) => entry.stores >= cost)?.year ?? null
}

export function defaultModifiers(count: number): ModifierId[] {
  return Array.from({ length: count }, () => 'status-quo' as ModifierId)
}

/** Rebuilds a modifier list from untrusted input. */
export function sanitizeModifiers(input: unknown): ModifierId[] {
  const valid = new Set(incomeModifiers.map((entry) => entry.id))
  if (!Array.isArray(input)) return defaultModifiers(5)
  const cleaned = input
    .slice(0, 50)
    .map((value) => (valid.has(value as ModifierId) ? (value as ModifierId) : 'status-quo'))
  return cleaned.length > 0 ? cleaned : defaultModifiers(5)
}
