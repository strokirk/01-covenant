import { createEffect, createMemo, createSignal } from 'solid-js'
import { createStore, produce } from 'solid-js/store'
import { compareOptions, optionsById } from './data.ts'
import { covenantFromHash, sanitize } from './share.ts'
import type { Covenant } from './types.ts'

const STORAGE_KEY = 'covenant-builder:covenant:v1'

function loadCovenant(): Covenant {
  // A shared link wins over saved local work: following one is an explicit
  // request to look at that covenant.
  const shared = covenantFromHash()
  if (shared) return shared
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    // sanitize also drops ids that no longer exist, so a data regeneration
    // cannot leave phantom selections contributing to the balance.
    return sanitize(stored ? (JSON.parse(stored) as Partial<Covenant>) : null)
  } catch {
    return sanitize(null)
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

/** Replaces the whole covenant, e.g. from an imported file. */
export function replaceCovenant(next: Covenant): void {
  setCovenant(
    produce((draft) => {
      draft.name = next.name
      draft.selections = { ...next.selections }
    }),
  )
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
