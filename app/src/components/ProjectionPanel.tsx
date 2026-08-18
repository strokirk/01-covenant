import { For, Show, createMemo } from 'solid-js'
import './ProjectionPanel.css'
import { optionsById } from '../data.ts'
import { constructionTotals } from '../lib/construction.ts'
import { countOf } from '../lib/text.ts'
import { incomeModifiers, project, yearAffordable } from '../lib/projection.ts'
import type { ModifierId } from '../lib/projection.ts'
import {
  expenditure,
  formatPounds,
  income,
  laborerSaving,
  pointsOfLaboratories,
} from '../lib/wealth.ts'
import { covenant, setCovenant } from '../store.ts'
import { Button } from './ui/Button.tsx'

export function ProjectionPanel() {
  const wealth = () => covenant.wealth
  const selected = createMemo(() =>
    Object.keys(covenant.selections).flatMap((id) => {
      const option = optionsById.get(id)
      return option ? [option] : []
    }),
  )

  /** Inflation is projected year by year, so it is excluded from the base. */
  const baseExpenditure = createMemo(
    () =>
      expenditure(wealth(), selected())
        .filter((line) => line.id !== 'inflation')
        .reduce((total, line) => total + line.pounds, 0) - laborerSaving(wealth()),
  )

  const years = createMemo(() =>
    project({
      baseIncome: income(wealth()).total,
      baseExpenditure: baseExpenditure(),
      startingInflation: wealth().inflation,
      startingStores: wealth().projection.startingStores,
      modifiers: wealth().projection.modifiers,
    }),
  )

  const plan = createMemo(() =>
    constructionTotals(wealth().projects, wealth().virgates, pointsOfLaboratories(wealth())),
  )
  const affordable = createMemo(() => yearAffordable(years(), plan().total))

  const setModifier = (index: number, value: ModifierId) =>
    setCovenant('wealth', 'projection', 'modifiers', index, value)

  const setYearCount = (delta: number) =>
    setCovenant('wealth', 'projection', 'modifiers', (existing) => {
      if (delta > 0) return [...existing, 'status-quo' as ModifierId]
      return existing.length > 1 ? existing.slice(0, -1) : existing
    })

  return (
    <section class="wealth-section">
      <h2>Years ahead</h2>
      <p class="wealth-note">
        Each year the storyguide picks an effect from the Income Modification table. The changes are
        usually permanent, so they compound: five years of Expansion turn a Typical source into
        something like a Greater one. Inflation climbs by about a pound per hundred pounds spent.
      </p>

      <label class="wealth-field projection-stores">
        <span class="wealth-field-label">
          Starting stores
          <span class="wealth-field-hint">silver already in hand, in pounds</span>
        </span>
        <input
          class="field"
          type="number"
          min="0"
          value={wealth().projection.startingStores}
          onInput={(event) =>
            setCovenant(
              'wealth',
              'projection',
              'startingStores',
              Math.max(0, Number(event.currentTarget.value) || 0),
            )
          }
        />
      </label>

      <div class="construction-scroll">
        <table class="wealth-table projection-table">
          <thead>
            <tr>
              <th scope="col">Year</th>
              <th scope="col">Fortune</th>
              <th scope="col">Income</th>
              <th scope="col">Inflation</th>
              <th scope="col">Spent</th>
              <th scope="col">Net</th>
              <th scope="col">Stores</th>
            </tr>
          </thead>
          <tbody>
            <For each={years()}>
              {(entry, index) => (
                <tr>
                  <th scope="row">{entry.year}</th>
                  <td>
                    <select
                      class="field"
                      value={entry.modifier}
                      aria-label={`Year ${entry.year} fortune`}
                      onChange={(event) =>
                        setModifier(index(), event.currentTarget.value as ModifierId)
                      }
                    >
                      <For each={incomeModifiers}>
                        {(modifier) => (
                          <option value={modifier.id}>
                            {modifier.label} (×{modifier.multiplier}, {modifier.die})
                          </option>
                        )}
                      </For>
                    </select>
                  </td>
                  <td class="wealth-amount">{formatPounds(entry.income)}</td>
                  <td class="wealth-amount">{formatPounds(entry.inflation)}</td>
                  <td class="wealth-amount">{formatPounds(entry.expenditure)}</td>
                  <td class="wealth-amount" classList={{ 'is-deficit': entry.net < 0 }}>
                    {entry.net < 0 ? '−' : ''}
                    {formatPounds(Math.abs(entry.net))}
                  </td>
                  <td class="wealth-amount" classList={{ 'is-deficit': entry.stores < 0 }}>
                    {entry.stores < 0 ? '−' : ''}
                    {formatPounds(Math.abs(entry.stores))}
                  </td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </div>

      <div class="projection-controls">
        <Button class="is-small" onClick={() => setYearCount(1)}>
          Add a year
        </Button>
        <Button
          class="is-small"
          disabled={wealth().projection.modifiers.length <= 1}
          onClick={() => setYearCount(-1)}
        >
          Remove a year
        </Button>
      </div>

      <Show when={plan().total > 0}>
        <p class="projection-verdict" classList={{ 'is-out-of-reach': affordable() === null }}>
          <Show
            when={affordable() !== null}
            fallback={
              <>
                The building plan costs {formatPounds(plan().total)} lb, which these{' '}
                {countOf(years().length, 'year')} never reach. Project further ahead, find better
                fortune, or trim the plan.
              </>
            }
          >
            The building plan costs {formatPounds(plan().total)} lb — affordable in year{' '}
            {affordable()}.
          </Show>
        </p>
      </Show>
    </section>
  )
}
