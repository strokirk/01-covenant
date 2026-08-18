import { For, Show, createMemo } from 'solid-js'
import './WealthPanel.css'
import { optionsById } from '../data.ts'
import {
  balanceSheet,
  expenditure,
  formatPounds,
  income,
  inhabitantLabels,
  incomeCategories,
  labUseLabels,
  laborerSaving,
  pointsOfInhabitants,
  pointsOfLaboratories,
  requiredStaff,
} from '../lib/wealth.ts'
import type { InhabitantKind, LabUse, IncomeCategory } from '../lib/wealth.ts'
import { covenant, setCovenant } from '../store.ts'
import { ProjectionPanel } from './ProjectionPanel.tsx'
import { Button } from './ui/Button.tsx'

const inhabitantOrder = Object.keys(inhabitantLabels) as InhabitantKind[]

/** A labelled number input bound to one field of the wealth state. */
function NumberField(props: {
  label: string
  value: number
  min?: number
  step?: number
  hint?: string
  onInput: (value: number) => void
}) {
  return (
    <label class="wealth-field">
      <span class="wealth-field-label">
        {props.label}
        <Show when={props.hint}>
          <span class="wealth-field-hint">{props.hint}</span>
        </Show>
      </span>
      <input
        class="field"
        type="number"
        min={props.min ?? 0}
        step={props.step ?? 1}
        value={props.value}
        onInput={(event) => props.onInput(Number(event.currentTarget.value) || 0)}
      />
    </label>
  )
}

export function WealthPanel() {
  const wealth = () => covenant.wealth
  const selected = createMemo(() =>
    Object.keys(covenant.selections).flatMap((id) => {
      const option = optionsById.get(id)
      return option ? [option] : []
    }),
  )

  const points = createMemo(() => pointsOfInhabitants(wealth()))
  const staff = createMemo(() => requiredStaff(wealth()))
  const lines = createMemo(() => expenditure(wealth(), selected()))
  const sheet = createMemo(() => balanceSheet(wealth(), selected()))
  const breakdown = createMemo(() => income(wealth()))

  const setWealth = <K extends keyof ReturnType<typeof wealth>>(
    key: K,
    value: ReturnType<typeof wealth>[K],
  ) => setCovenant('wealth', key, value)

  return (
    <div class="wealth">
      <section class="wealth-section">
        <h2>Income</h2>
        <p class="wealth-note">
          Each source is one large enterprise. A new covenant starts with a single Typical source,
          or two Lesser ones; the Wealth Boons and Poverty Hooks change that.
        </p>

        <ul class="wealth-rows">
          <For each={wealth().incomeSources}>
            {(source, index) => (
              <li class="wealth-row">
                <input
                  class="field wealth-row-name"
                  value={source.label}
                  aria-label="Source name"
                  onInput={(event) =>
                    setCovenant('wealth', 'incomeSources', index(), 'label', event.currentTarget.value)
                  }
                />
                <select
                  class="field"
                  value={source.category}
                  aria-label="Source category"
                  onChange={(event) =>
                    setCovenant(
                      'wealth',
                      'incomeSources',
                      index(),
                      'category',
                      event.currentTarget.value as IncomeCategory,
                    )
                  }
                >
                  <For each={incomeCategories}>
                    {(entry) => (
                      <option value={entry.id}>
                        {entry.label} — {entry.pounds} lb ({entry.source})
                      </option>
                    )}
                  </For>
                </select>
                <Button
                  variant="bare"
                  class="wealth-remove"
                  aria-label={`Remove ${source.label}`}
                  onClick={() =>
                    setWealth(
                      'incomeSources',
                      wealth().incomeSources.filter((_, position) => position !== index()),
                    )
                  }
                >
                  ×
                </Button>
              </li>
            )}
          </For>
        </ul>

        <Button
          onClick={() =>
            setWealth('incomeSources', [
              ...wealth().incomeSources,
              { id: crypto.randomUUID(), label: 'New source', category: 'typical' },
            ])
          }
        >
          Add source
        </Button>

        <dl class="wealth-figures">
          <div>
            <dt>Sources</dt>
            <dd>{formatPounds(breakdown().base)} lb</dd>
          </div>
          <div>
            <dt>Magi adjustment</dt>
            <dd>
              {breakdown().magusAdjustment >= 0 ? '+' : '−'}
              {formatPounds(Math.abs(breakdown().magusAdjustment))} lb
            </dd>
          </div>
          <div class="is-total">
            <dt>Annual income</dt>
            <dd>{formatPounds(breakdown().total)} lb</dd>
          </div>
        </dl>
        <p class="wealth-note">
          The 100-pound baseline assumes about six magi, so income shifts by 15 pounds per magus
          either side of that (6 pounds for a covenant living on Lesser sources alone).
        </p>
      </section>

      <section class="wealth-section">
        <h2>Inhabitants</h2>
        <div class="wealth-seasons" role="group" aria-label="Covenant season">
          <Button
            active={wealth().season === 'spring-winter'}
            onClick={() => setWealth('season', 'spring-winter')}
          >
            Spring / Winter
          </Button>
          <Button
            active={wealth().season === 'summer-autumn'}
            onClick={() => setWealth('season', 'summer-autumn')}
          >
            Summer / Autumn
          </Button>
        </div>

        <div class="wealth-grid">
          <For each={inhabitantOrder}>
            {(kind) => (
              <NumberField
                label={inhabitantLabels[kind]}
                value={wealth().inhabitants[kind]}
                onInput={(value) => setCovenant('wealth', 'inhabitants', kind, Math.max(0, value))}
              />
            )}
          </For>
        </div>

        <dl class="wealth-figures">
          <div class="is-total">
            <dt>Points of inhabitants</dt>
            <dd>{points()}</dd>
          </div>
          <div classList={{ 'is-short': wealth().inhabitants.servants < staff().servants }}>
            <dt>Servants needed</dt>
            <dd>{staff().servants}</dd>
          </div>
          <div classList={{ 'is-short': wealth().inhabitants.teamsters < staff().teamsters }}>
            <dt>Teamsters needed</dt>
            <dd>{staff().teamsters}</dd>
          </div>
        </dl>
        <p class="wealth-note">
          Two servants per 10 points of inhabitants (excluding laborers, servants and teamsters),
          then one teamster per 10 points, less two per laborer. These are minimums the book asks
          you to meet — nothing here enforces them.
        </p>
      </section>

      <section class="wealth-section">
        <h2>Laboratories</h2>
        <ul class="wealth-rows">
          <For each={wealth().laboratories}>
            {(lab, index) => (
              <li class="wealth-row">
                <input
                  class="field wealth-row-name"
                  value={lab.label}
                  aria-label="Laboratory name"
                  onInput={(event) =>
                    setCovenant('wealth', 'laboratories', index(), 'label', event.currentTarget.value)
                  }
                />
                <label class="wealth-inline">
                  Upkeep
                  <input
                    class="field wealth-upkeep"
                    type="number"
                    min="-5"
                    value={lab.upkeep}
                    onInput={(event) =>
                      setCovenant(
                        'wealth',
                        'laboratories',
                        index(),
                        'upkeep',
                        Math.max(-5, Number(event.currentTarget.value) || 0),
                      )
                    }
                  />
                </label>
                <select
                  class="field"
                  value={lab.use}
                  aria-label="Laboratory use"
                  onChange={(event) =>
                    setCovenant(
                      'wealth',
                      'laboratories',
                      index(),
                      'use',
                      event.currentTarget.value as LabUse,
                    )
                  }
                >
                  <For each={Object.entries(labUseLabels)}>
                    {([value, label]) => <option value={value}>{label}</option>}
                  </For>
                </select>
                <Button
                  variant="bare"
                  class="wealth-remove"
                  aria-label={`Remove ${lab.label}`}
                  onClick={() =>
                    setWealth(
                      'laboratories',
                      wealth().laboratories.filter((_, position) => position !== index()),
                    )
                  }
                >
                  ×
                </Button>
              </li>
            )}
          </For>
        </ul>
        <Button
          onClick={() =>
            setWealth('laboratories', [
              ...wealth().laboratories,
              { id: crypto.randomUUID(), label: 'Laboratory', upkeep: 0, use: 'typical' },
            ])
          }
        >
          Add laboratory
        </Button>
        <dl class="wealth-figures">
          <div class="is-total">
            <dt>Points of laboratories</dt>
            <dd>{formatPounds(pointsOfLaboratories(wealth()))}</dd>
          </div>
        </dl>
      </section>

      <section class="wealth-section">
        <h2>Other costs</h2>
        <div class="wealth-grid">
          <NumberField
            label="Weapon & armor points"
            hint="1 lb per 320 points"
            value={wealth().weaponPoints}
            onInput={(value) => setWealth('weaponPoints', value)}
          />
          <NumberField
            label="Scribes & illuminators"
            hint="1 lb each"
            value={wealth().scribes}
            onInput={(value) => setWealth('scribes', value)}
          />
          <NumberField
            label="Soldier pennies per day"
            hint="1 lb per penny"
            value={wealth().soldierPenniesPerDay}
            onInput={(value) => setWealth('soldierPenniesPerDay', value)}
          />
          <NumberField
            label="Tithes (lb)"
            value={wealth().tithes}
            onInput={(value) => setWealth('tithes', value)}
          />
          <NumberField
            label="Inflation (lb)"
            hint="0 in year one"
            value={wealth().inflation}
            onInput={(value) => setWealth('inflation', value)}
          />
        </div>
      </section>

      <section class="wealth-section">
        <h2>Yearly balance</h2>
        <table class="wealth-table">
          <thead>
            <tr>
              <th scope="col">Category</th>
              <th scope="col">Pounds</th>
              <th scope="col">Rule</th>
            </tr>
          </thead>
          <tbody>
            <For each={lines()}>
              {(line) => (
                <tr>
                  <th scope="row">{line.label}</th>
                  <td class="wealth-amount">{formatPounds(line.pounds)}</td>
                  <td class="wealth-rule">{line.rule}</td>
                </tr>
              )}
            </For>
            <Show when={laborerSaving(wealth()) > 0}>
              <tr class="is-saving">
                <th scope="row">Laborers</th>
                <td class="wealth-amount">−{formatPounds(laborerSaving(wealth()))}</td>
                <td class="wealth-rule">
                  1 lb saved on Provisions each, capped at half the Provisions total
                </td>
              </tr>
            </Show>
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">Expenditure</th>
              <td class="wealth-amount">
                {formatPounds(sheet().expenditure - sheet().savings)}
              </td>
              <td />
            </tr>
            <tr>
              <th scope="row">Income</th>
              <td class="wealth-amount">{formatPounds(sheet().income)}</td>
              <td />
            </tr>
            <tr class="is-net" classList={{ 'is-deficit': sheet().net < 0 }}>
              <th scope="row">{sheet().net < 0 ? 'Annual shortfall' : 'Annual surplus'}</th>
              <td class="wealth-amount">{formatPounds(Math.abs(sheet().net))}</td>
              <td class="wealth-rule">
                {sheet().net < 0
                  ? 'The covenant is eating into its stores.'
                  : 'Added to the covenant’s stores each year.'}
              </td>
            </tr>
          </tfoot>
        </table>
      </section>

      <ProjectionPanel />
    </div>
  )
}
