import { For, Show } from 'solid-js'
import { magnitudeLabel } from '../data.ts'
import { clearSelections, selectedOptions, toggle } from '../store.ts'

export function SelectionSummary() {
  return (
    <aside class="summary">
      <div class="summary-head">
        <h2>Chosen</h2>
        <Show when={selectedOptions().length > 0}>
          <button type="button" class="link-button" onClick={clearSelections}>
            Clear all
          </button>
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
                <button
                  type="button"
                  class="summary-remove"
                  onClick={() => toggle(option.id)}
                  aria-label={`Remove ${option.name}`}
                >
                  ×
                </button>
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
