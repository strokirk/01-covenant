import { Show } from 'solid-js'
import './BalanceBar.css'
import { countOf } from '../lib/text.ts'
import { balance, boonPoints, hookPoints } from '../store.ts'

/** Plain-language reading of the Boon/Hook balance, per "Paying for Choices". */
function verdict(difference: number): { text: string; state: string } {
  if (boonPoints() === 0 && hookPoints() === 0) {
    return { text: 'Nothing chosen yet', state: 'empty' }
  }
  if (difference === 0) return { text: 'Balanced', state: 'balanced' }
  const need = difference > 0 ? 'Hook' : 'Boon'
  return {
    text: `${countOf(Math.abs(difference), `${need} point`)} needed`,
    state: 'unbalanced',
  }
}

export function BalanceBar() {
  return (
    <div class="balance" data-state={verdict(balance()).state}>
      <div class="balance-tally">
        <span class="balance-figure">
          <strong>{boonPoints()}</strong> Boon pts
        </span>
        <span class="balance-versus">vs</span>
        <span class="balance-figure">
          <strong>{hookPoints()}</strong> Hook pts
        </span>
      </div>
      <div class="balance-verdict">
        <Show when={balance() === 0 && boonPoints() > 0}>
          <span class="balance-check" aria-hidden="true">
            ✓
          </span>
        </Show>
        {verdict(balance()).text}
      </div>
    </div>
  )
}
