import raw from './data/boons-hooks.json'
import rawSituations from './data/situations.json'
import type { BoonHook, CategoryId, Situation } from './types.ts'

/**
 * The JSON is generated, so its inferred type widens `magnitude` and friends
 * to `string`. The generator guarantees the narrower shape.
 */
export const options = raw as unknown as BoonHook[]

export const situations = rawSituations as unknown as Situation[]

export const optionsById = new Map(options.map((option) => [option.id, option]))

/** Categories in book order, with the blurb the app shows above each list. */
export const categories: { id: CategoryId; label: string }[] = [
  { id: 'site', label: 'Site' },
  { id: 'fortifications', label: 'Fortifications' },
  { id: 'resources', label: 'Resources' },
  { id: 'residents', label: 'Residents' },
  { id: 'external-relations', label: 'External Relations' },
  { id: 'surroundings', label: 'Surroundings' },
]

/** Sort order within a category: Boons before Hooks, Major before Minor. */
const kindRank: Record<string, number> = { boon: 0, hook: 1, free: 2 }
const magnitudeRank: Record<string, number> = { major: 0, minor: 1, free: 2 }

export function compareOptions(a: BoonHook, b: BoonHook): number {
  return (
    kindRank[a.kind] - kindRank[b.kind] ||
    magnitudeRank[a.magnitude] - magnitudeRank[b.magnitude] ||
    a.name.localeCompare(b.name)
  )
}

export function magnitudeLabel(option: BoonHook): string {
  if (option.kind === 'free') return 'Free Choice'
  const magnitude = option.magnitude === 'major' ? 'Major' : 'Minor'
  return `${magnitude} ${option.kind === 'boon' ? 'Boon' : 'Hook'}`
}
