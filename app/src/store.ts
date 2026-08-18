import { createEffect, createMemo, createSignal } from 'solid-js'
import { createStore, produce } from 'solid-js/store'
import { compareOptions, optionsById } from './data.ts'
import type { Covenant } from './types.ts'

const STORAGE_KEY = 'covenant-builder:covenant:v1'

function loadCovenant(): Covenant {
  const empty: Covenant = { name: '', selections: {} }
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return empty
    const parsed = JSON.parse(stored) as Partial<Covenant>
    return {
      name: typeof parsed.name === 'string' ? parsed.name : '',
      // Drop ids that no longer exist, so a data regeneration cannot leave
      // phantom selections contributing to the balance.
      selections: Object.fromEntries(
        Object.entries(parsed.selections ?? {}).filter(
          ([id, count]) => optionsById.has(id) && typeof count === 'number' && count > 0,
        ),
      ),
    }
  } catch {
    return empty
  }
}

export const [covenant, setCovenant] = createStore<Covenant>(loadCovenant())

createEffect(() => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(covenant))
  } catch {
    // A full or unavailable localStorage shouldn't break the builder.
  }
})

export function countOf(id: string): number {
  return covenant.selections[id] ?? 0
}

/** Adds or removes picks of an option, clamped to its allowed range. */
export function adjust(id: string, delta: number): void {
  const option = optionsById.get(id)
  if (!option) return
  const next = Math.min(Math.max(countOf(id) + delta, 0), option.maxTimes)
  setCovenant(
    produce((draft) => {
      // Deleting rather than storing 0 keeps the persisted covenant tidy.
      if (next === 0) delete draft.selections[id]
      else draft.selections[id] = next
    }),
  )
}

export function toggle(id: string): void {
  adjust(id, countOf(id) > 0 ? -countOf(id) : 1)
}

export function clearSelections(): void {
  setCovenant(produce((draft) => void (draft.selections = {})))
}

function pointsFor(kind: 'boon' | 'hook'): number {
  return Object.entries(covenant.selections).reduce((total, [id, count]) => {
    const option = optionsById.get(id)
    return option?.kind === kind ? total + option.points * count : total
  }, 0)
}

export const boonPoints = createMemo(() => pointsFor('boon'))
export const hookPoints = createMemo(() => pointsFor('hook'))

/**
 * A player covenant balances when Boon points equal Hook points
 * (Covenants, "Paying for Choices"). Positive means Boons outweigh Hooks.
 */
export const balance = createMemo(() => boonPoints() - hookPoints())

export const selectedOptions = createMemo(() =>
  Object.entries(covenant.selections)
    .flatMap(([id, count]) => {
      const option = optionsById.get(id)
      return option ? [{ option, count }] : []
    })
    .sort(
      (a, b) =>
        a.option.categoryLabel.localeCompare(b.option.categoryLabel) ||
        compareOptions(a.option, b.option),
    ),
)

/** Which option's full description is expanded in the list. */
export const [expandedId, setExpandedId] = createSignal<string | null>(null)
