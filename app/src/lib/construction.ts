/**
 * Building and expanding a covenant, from Covenants ch. 5 (Sundry Expenses →
 * Property, and the Price List). These are one-off costs, distinct from the
 * yearly upkeep in wealth.ts.
 */

/** Price List → Buildings. Costs are for a Standard building of Average size. */
export const buildingTypes: { id: string; label: string; pounds: number; floors: number }[] = [
  { id: 'house', label: 'House', pounds: 1, floors: 1 },
  { id: 'bridge', label: 'Bridge', pounds: 2, floors: 1 },
  { id: 'mill', label: 'Mill', pounds: 5, floors: 2 },
  { id: 'gatehouse', label: 'Gatehouse', pounds: 7, floors: 2 },
  { id: 'chapel', label: 'Chapel', pounds: 8, floors: 1 },
  { id: 'manor-house', label: 'Manor house', pounds: 10, floors: 2 },
  { id: 'motte-and-bailey', label: 'Motte and bailey', pounds: 12, floors: 2 },
  { id: 'church', label: 'Church', pounds: 50, floors: 3 },
  { id: 'tower', label: 'Tower', pounds: 100, floors: 4 },
  { id: 'castle', label: 'Castle', pounds: 1000, floors: 4 },
]

export type MultiplierId = 'shoddy' | 'standard' | 'superior' | 'excellent' | 'flawless'

/**
 * Quality and Size Multipliers. Quality and size are separate axes and both
 * can apply: "something that is both Huge and of Excellent quality has a
 * total multiplier of 25".
 */
export const multipliers: {
  id: MultiplierId
  quality: string
  size: string
  factor: number
}[] = [
  { id: 'shoddy', quality: 'Shoddy', size: 'Small', factor: 0.5 },
  { id: 'standard', quality: 'Standard', size: 'Average', factor: 1 },
  { id: 'superior', quality: 'Superior', size: 'Large', factor: 2 },
  { id: 'excellent', quality: 'Excellent', size: 'Huge', factor: 5 },
  { id: 'flawless', quality: 'Flawless', size: 'Stupendous', factor: 10 },
]

const factorOf = (id: MultiplierId): number =>
  multipliers.find((entry) => entry.id === id)?.factor ?? 1

export interface BuildingProject {
  id: string
  /** Catalogue entry, or 'housing' for quarters priced by who they house. */
  typeId: string
  label: string
  quality: MultiplierId
  size: MultiplierId
  quantity: number
  /** Storeys, or ten-foot increments of height — one year of work each. */
  floors: number
  /** Paying 50% more doubles the building rate. */
  rushed: boolean
  /**
   * For covenfolk quarters: "new buildings designed for covenfolk can be
   * assigned a cost equal to the number of points of inhabitants they are to
   * house". Ignored for catalogue buildings.
   */
  housingPoints: number
}

export const HOUSING_TYPE_ID = 'housing'

/** Base price before multipliers, quantity or rush. */
export function basePrice(project: BuildingProject): number {
  if (project.typeId === HOUSING_TYPE_ID) return project.housingPoints
  return buildingTypes.find((entry) => entry.id === project.typeId)?.pounds ?? 0
}

export function projectCost(project: BuildingProject): number {
  const base = basePrice(project) * factorOf(project.quality) * factorOf(project.size)
  const rush = project.rushed ? 1.5 : 1
  return base * Math.max(0, project.quantity) * rush
}

/**
 * "It takes one year per floor (or ten feet of height) to build. This rate
 * can be doubled by paying 50% more." Quantity is assumed to be built in
 * parallel — a covenant raising six huts does not wait six years.
 */
export function projectYears(project: BuildingProject): number {
  const years = Math.max(0, project.floors)
  return project.rushed ? years / 2 : years
}

/** One virgate of arable land, or two of wild land, costs 10 pounds. */
export const POUNDS_PER_VIRGATE = 10

export function landCost(virgates: number): number {
  return Math.max(0, virgates) * POUNDS_PER_VIRGATE
}

/** "Roughly one virgate of arable land is needed for each farmhand laborer." */
export function virgatesForLaborers(laborers: number): number {
  return Math.max(0, laborers)
}

/**
 * "The materials needed to outfit a laboratory cost one pound per two points
 * of the laboratory" — so a standard lab (Upkeep 0, ten points) costs five.
 * Upgrades cost a pound per two points of increase.
 */
export function laboratoryOutfitCost(labPoints: number): number {
  return Math.max(0, labPoints) / 2
}

export interface ConstructionTotals {
  buildings: number
  land: number
  laboratories: number
  total: number
  /** Longest single project; separate projects are assumed to run in parallel. */
  years: number
}

export function constructionTotals(
  projects: BuildingProject[],
  virgates: number,
  labPointsToOutfit: number,
): ConstructionTotals {
  const buildings = projects.reduce((sum, project) => sum + projectCost(project), 0)
  const land = landCost(virgates)
  const laboratories = laboratoryOutfitCost(labPointsToOutfit)
  return {
    buildings,
    land,
    laboratories,
    total: buildings + land + laboratories,
    years: projects.reduce((longest, project) => Math.max(longest, projectYears(project)), 0),
  }
}

export function emptyProject(id: string): BuildingProject {
  return {
    id,
    typeId: 'house',
    label: 'House',
    quality: 'standard',
    size: 'standard',
    quantity: 1,
    floors: 1,
    rushed: false,
    housingPoints: 0,
  }
}

/** Rebuilds a project list from untrusted input. */
export function sanitizeProjects(input: unknown): BuildingProject[] {
  if (!Array.isArray(input)) return []
  const validMultipliers = new Set(multipliers.map((entry) => entry.id))
  const validTypes = new Set([...buildingTypes.map((entry) => entry.id), HOUSING_TYPE_ID])
  const number = (value: unknown, fallback: number) =>
    typeof value === 'number' && Number.isFinite(value) && value >= 0
      ? Math.min(value, 100_000)
      : fallback

  return input.slice(0, 60).flatMap((raw, index) => {
    if (!raw || typeof raw !== 'object') return []
    const project = raw as Partial<BuildingProject>
    if (!validTypes.has(String(project.typeId))) return []
    return [
      {
        id: String(project.id ?? index),
        typeId: String(project.typeId),
        label: String(project.label ?? 'Building').slice(0, 80),
        quality: validMultipliers.has(project.quality as MultiplierId)
          ? (project.quality as MultiplierId)
          : 'standard',
        size: validMultipliers.has(project.size as MultiplierId)
          ? (project.size as MultiplierId)
          : 'standard',
        quantity: Math.floor(number(project.quantity, 1)),
        floors: Math.floor(number(project.floors, 1)),
        rushed: project.rushed === true,
        housingPoints: Math.floor(number(project.housingPoints, 0)),
      },
    ]
  })
}
