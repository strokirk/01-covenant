import { For, Show } from 'solid-js'
import './SelectionSummary.css'
import { magnitudeLabel } from '../data.ts'
import { clearSelections, selectedOptions, toggle } from '../store.ts'
import { Button } from './ui/Button.tsx'

export function SelectionSummary() {
  return (
    <aside class="summary">
      <div class="summary-head">
        <h2>Chosen</h2>
        <Show when={selectedOptions().length > 0}>
          <Button variant="link" onClick={clearSelections}>
            Clear all
          </Button>
        </Show>
      </div>

      <Show
        when={selectedOptions().length > 0}
        fallback={
          <p class="summary-empty">
            Pick Boons and Hooks from the list. A covenant built for player magi balances when its
            Boon points equal its Hook points.
          </p>
        }
      >
        <ul class="summary-list">
          <For each={selectedOptions()}>
            {({ option, count }) => (
              <li>
                <Button
                  variant="bare"
                  class="summary-remove"
                  onClick={() => toggle(option.id)}
                  aria-label={`Remove ${option.name}`}
                >
                  ×
                </Button>
                <span class="summary-name">
                  {option.name}
                  <Show when={count > 1}> ×{count}</Show>
                </span>
                <span class="summary-meta">
                  {option.categoryLabel} · {magnitudeLabel(option)}
                </span>
              </li>
            )}
          </For>
        </ul>
      </Show>
    </aside>
  )
}
