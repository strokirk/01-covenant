import { For, Show, createMemo } from 'solid-js'
import './ConstructionPanel.css'
import {
  HOUSING_TYPE_ID,
  buildingTypes,
  constructionTotals,
  emptyProject,
  multipliers,
  projectCost,
  projectYears,
  virgatesForLaborers,
} from '../lib/construction.ts'
import type { BuildingProject, MultiplierId } from '../lib/construction.ts'
import { formatPounds, pointsOfInhabitants, pointsOfLaboratories } from '../lib/wealth.ts'
import { countOf } from '../lib/text.ts'
import { covenant, setCovenant } from '../store.ts'
import { Button } from './ui/Button.tsx'

export function ConstructionPanel() {
  const wealth = () => covenant.wealth
  const projects = () => wealth().projects
  const labPoints = createMemo(() => pointsOfLaboratories(wealth()))
  const totals = createMemo(() => constructionTotals(projects(), wealth().virgates, labPoints()))
  const suggestedVirgates = createMemo(() => virgatesForLaborers(wealth().inhabitants.laborers))

  const update = <K extends keyof BuildingProject>(
    index: number,
    key: K,
    value: BuildingProject[K],
  ) => setCovenant('wealth', 'projects', index, key, value)

  const addProject = (typeId: string) => {
    const type = buildingTypes.find((entry) => entry.id === typeId)
    setCovenant('wealth', 'projects', (existing) => [
      ...existing,
      {
        ...emptyProject(crypto.randomUUID()),
        typeId,
        label: type?.label ?? 'Covenfolk quarters',
        floors: type?.floors ?? 1,
        housingPoints: typeId === HOUSING_TYPE_ID ? 5 : 0,
      },
    ])
  }

  return (
    <div class="construction">
      <section class="wealth-section">
        <h2>Building projects</h2>
        <p class="wealth-note">
          One-off costs, separate from the yearly upkeep on the Wealth page. A building takes one
          year per floor (or ten feet of height); paying half again doubles the rate. Quality and
          size multiply together, so a Huge building of Excellent quality costs 25 times the base.
        </p>

        <Show
          when={projects().length > 0}
          fallback={<p class="construction-empty">No projects planned yet.</p>}
        >
          <div class="construction-scroll">
            <table class="wealth-table construction-table">
              <thead>
                <tr>
                  <th scope="col">Project</th>
                  <th scope="col">Quality</th>
                  <th scope="col">Size</th>
                  <th scope="col">Qty</th>
                  <th scope="col">Floors</th>
                  <th scope="col">Rush</th>
                  <th scope="col">Cost</th>
                  <th scope="col">Years</th>
                  <th scope="col"><span class="visually-hidden">Remove</span></th>
                </tr>
              </thead>
              <tbody>
                <For each={projects()}>
                  {(project, index) => (
                    <tr>
                      <th scope="row">
                        <input
                          class="field construction-name"
                          value={project.label}
                          aria-label="Project name"
                          onInput={(event) => update(index(), 'label', event.currentTarget.value)}
                        />
                        <Show when={project.typeId === HOUSING_TYPE_ID}>
                          <label class="construction-inline">
                            housing
                            <input
                              class="field construction-tiny"
                              type="number"
                              min="0"
                              value={project.housingPoints}
                              aria-label="Points of inhabitants housed"
                              onInput={(event) =>
                                update(
                                  index(),
                                  'housingPoints',
                                  Math.max(0, Number(event.currentTarget.value) || 0),
                                )
                              }
                            />
                            pts
                          </label>
                        </Show>
                      </th>
                      <td>
                        <select
                          class="field"
                          value={project.quality}
                          aria-label="Quality"
                          onChange={(event) =>
                            update(index(), 'quality', event.currentTarget.value as MultiplierId)
                          }
                        >
                          <For each={multipliers}>
                            {(entry) => (
                              <option value={entry.id}>
                                {entry.quality} (×{entry.factor})
                              </option>
                            )}
                          </For>
                        </select>
                      </td>
                      <td>
                        <select
                          class="field"
                          value={project.size}
                          aria-label="Size"
                          onChange={(event) =>
                            update(index(), 'size', event.currentTarget.value as MultiplierId)
                          }
                        >
                          <For each={multipliers}>
                            {(entry) => (
                              <option value={entry.id}>
                                {entry.size} (×{entry.factor})
                              </option>
                            )}
                          </For>
                        </select>
                      </td>
                      <td>
                        <input
                          class="field construction-tiny"
                          type="number"
                          min="0"
                          value={project.quantity}
                          aria-label="Quantity"
                          onInput={(event) =>
                            update(
                              index(),
                              'quantity',
                              Math.max(0, Number(event.currentTarget.value) || 0),
                            )
                          }
                        />
                      </td>
                      <td>
                        <input
                          class="field construction-tiny"
                          type="number"
                          min="0"
                          value={project.floors}
                          aria-label="Floors"
                          onInput={(event) =>
                            update(
                              index(),
                              'floors',
                              Math.max(0, Number(event.currentTarget.value) || 0),
                            )
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={project.rushed}
                          aria-label="Rush the build"
                          onChange={(event) => update(index(), 'rushed', event.currentTarget.checked)}
                        />
                      </td>
                      <td class="wealth-amount">{formatPounds(projectCost(project))}</td>
                      <td class="wealth-amount">{formatPounds(projectYears(project))}</td>
                      <td>
                        <Button
                          variant="bare"
                          class="wealth-remove"
                          aria-label={`Remove ${project.label}`}
                          onClick={() =>
                            setCovenant('wealth', 'projects', (existing) =>
                              existing.filter((_, position) => position !== index()),
                            )
                          }
                        >
                          ×
                        </Button>
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>
        </Show>

        <div class="construction-add">
          <For each={buildingTypes}>
            {(type) => (
              <Button class="is-small" onClick={() => addProject(type.id)}>
                + {type.label} <span class="construction-price">{type.pounds} lb</span>
              </Button>
            )}
          </For>
          <Button class="is-small" onClick={() => addProject(HOUSING_TYPE_ID)}>
            + Covenfolk quarters
          </Button>
        </div>
        <p class="wealth-note">
          Quarters for covenfolk cost a pound per point of inhabitants they house — a hut for a
          servant in a Spring covenant is one pound, a magus's house five. Your covenant currently
          houses {countOf(pointsOfInhabitants(wealth()), 'point')} of inhabitants.
        </p>
      </section>

      <section class="wealth-section">
        <h2>Land</h2>
        <label class="wealth-field construction-land">
          <span class="wealth-field-label">
            Virgates of arable land
            <span class="wealth-field-hint">10 lb each; two virgates of wild land for the same</span>
          </span>
          <input
            class="field"
            type="number"
            min="0"
            value={wealth().virgates}
            onInput={(event) =>
              setCovenant('wealth', 'virgates', Math.max(0, Number(event.currentTarget.value) || 0))
            }
          />
        </label>
        <p class="wealth-note">
          A virgate is about 30 acres, enough to support one peasant family; a square mile is about
          20 virgates. The book allows roughly one virgate per farmhand laborer, so your{' '}
          {countOf(wealth().inhabitants.laborers, 'laborer')} would want about{' '}
          {suggestedVirgates()}.
        </p>
      </section>

      <section class="wealth-section">
        <h2>Outfitting laboratories</h2>
        <p class="wealth-note">
          A laboratory costs one pound per two points to outfit from scratch, so a standard lab
          (Upkeep 0) costs five. Upgrading costs a pound per two points of increase. This figure
          follows the laboratories entered on the Wealth page.
        </p>
        <dl class="wealth-figures">
          <div>
            <dt>Points of laboratories</dt>
            <dd>{formatPounds(labPoints())}</dd>
          </div>
          <div class="is-total">
            <dt>Cost to outfit</dt>
            <dd>{formatPounds(totals().laboratories)} lb</dd>
          </div>
        </dl>
      </section>

      <section class="wealth-section">
        <h2>Total outlay</h2>
        <dl class="wealth-figures">
          <div>
            <dt>Buildings</dt>
            <dd>{formatPounds(totals().buildings)} lb</dd>
          </div>
          <div>
            <dt>Land</dt>
            <dd>{formatPounds(totals().land)} lb</dd>
          </div>
          <div>
            <dt>Laboratories</dt>
            <dd>{formatPounds(totals().laboratories)} lb</dd>
          </div>
          <div class="is-total">
            <dt>Total</dt>
            <dd>{formatPounds(totals().total)} lb</dd>
          </div>
          <div class="is-total">
            <dt>Longest build</dt>
            <dd>{countOf(totals().years, 'year')}</dd>
          </div>
        </dl>
        <p class="wealth-note">
          Projects are assumed to run in parallel, so the plan takes as long as its slowest item.
          Expansion on this scale is normally saved for and planned years ahead — compare the total
          against the annual surplus on the Wealth page.
        </p>
      </section>
    </div>
  )
}
