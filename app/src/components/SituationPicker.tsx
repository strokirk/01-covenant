import { For, Show, createSignal } from 'solid-js'
import './SituationPicker.css'
import { situations } from '../data.ts'
import { applySituation, covenant } from '../store.ts'
import type { Situation } from '../types.ts'
import { Button } from './ui/Button.tsx'

function unresolved(situation: Situation) {
  return situation.entries.filter((entry) => !entry.optionId)
}

function SituationRow(props: { situation: Situation; onApply: (situation: Situation) => void }) {
  const [open, setOpen] = createSignal(false)
  const missing = () => unresolved(props.situation)
  const balanced = () => props.situation.boonPoints === props.situation.hookPoints

  return (
    <li class="situation">
      <div class="situation-head">
        <Button
          variant="bare"
          class="situation-name"
          aria-expanded={open()}
          onClick={() => setOpen(!open())}
        >
          {props.situation.name}
        </Button>
        <span class="situation-tally" classList={{ 'is-uneven': !balanced() }}>
          {props.situation.boonPoints} / {props.situation.hookPoints}
        </span>
        <Button class="is-small" onClick={() => props.onApply(props.situation)}>
          Use
        </Button>
      </div>

      <Show when={open()}>
        <div class="situation-detail">
          <p>{props.situation.description}</p>

          <Show when={!balanced()}>
            <p class="situation-warning">
              As printed, this package tallies {props.situation.boonPoints} Boon points against{' '}
              {props.situation.hookPoints} Hook points. The book's own listing does not balance
              here, so expect to adjust it.
            </p>
          </Show>

          <Show when={missing().length > 0}>
            <p class="situation-note">
              These are named in the package but can't be matched to an option automatically — some
              are forms of governance from chapter three, others are shorthand the Boon and Hook
              lists spell differently. Add them by hand:
            </p>
            <ul class="situation-missing">
              <For each={missing()}>
                {(entry) => (
                  <li>
                    {entry.name}
                    <Show when={entry.count > 1}> ×{entry.count}</Show>
                    <Show when={entry.magnitude && entry.magnitude !== 'free'}>
                      {' '}
                      <span class="situation-missing-meta">
                        ({entry.magnitude} {entry.kind})
                      </span>
                    </Show>
                  </li>
                )}
              </For>
            </ul>
          </Show>
        </div>
      </Show>
    </li>
  )
}

export function SituationPicker() {
  const [open, setOpen] = createSignal(false)

  const apply = (situation: Situation) => {
    const hasWork = Object.keys(covenant.selections).length > 0
    if (hasWork && !confirm(`Replace your current selections with the ${situation.name} package?`)) {
      return
    }
    applySituation(situation)
    setOpen(false)
    scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <section class="situations">
      <Button variant="ghost" aria-expanded={open()} onClick={() => setOpen(!open())}>
        {open() ? 'Hide' : 'Start from'} a ready-made covenant situation
      </Button>

      <Show when={open()}>
        <p class="situations-intro">
          Eighteen packages of Boons and Hooks from the book, for troupes who want to move quickly.
          The two figures are the package's Boon and Hook points.
        </p>
        <ul class="situation-list">
          <For each={situations}>
            {(situation) => <SituationRow situation={situation} onApply={apply} />}
          </For>
        </ul>
      </Show>
    </section>
  )
}
