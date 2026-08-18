import { For, Show } from 'solid-js'
import { magnitudeLabel } from '../data.ts'
import { adjust, countOf, expandedId, setExpandedId, toggle } from '../store.ts'
import type { BoonHook } from '../types.ts'

export function OptionCard(props: { option: BoonHook }) {
  const count = () => countOf(props.option.id)
  const expanded = () => expandedId() === props.option.id
  const paragraphs = () => props.option.description.split('\n\n')
  const repeatable = () => props.option.maxTimes > 1

  return (
    <li class="option" classList={{ 'is-selected': count() > 0 }}>
      <div class="option-head">
        <button
          type="button"
          class="option-toggle"
          aria-pressed={count() > 0}
          onClick={() => toggle(props.option.id)}
        >
          <span class="option-name">{props.option.name}</span>
          <Show when={props.option.qualifier}>
            <span class="option-qualifier">({props.option.qualifier})</span>
          </Show>
        </button>

        <span class={`badge badge-${props.option.kind}`}>{magnitudeLabel(props.option)}</span>
        <Show when={props.option.points > 0}>
          <span class="badge badge-points">
            {props.option.points} pt{props.option.points === 1 ? '' : 's'}
          </span>
        </Show>

        <Show when={repeatable() && count() > 0}>
          <span class="stepper">
            <button
              type="button"
              onClick={() => adjust(props.option.id, -1)}
              aria-label={`Take ${props.option.name} one fewer time`}
            >
              −
            </button>
            <span class="stepper-count">×{count()}</span>
            <button
              type="button"
              onClick={() => adjust(props.option.id, 1)}
              disabled={count() >= props.option.maxTimes}
              aria-label={`Take ${props.option.name} one more time`}
            >
              +
            </button>
          </span>
        </Show>

        <button
          type="button"
          class="option-expand"
          aria-expanded={expanded()}
          onClick={() => setExpandedId(expanded() ? null : props.option.id)}
        >
          {expanded() ? 'Less' : 'More'}
        </button>
      </div>

      <p class="option-summary" classList={{ 'is-hidden': expanded() }}>
        {paragraphs()[0]}
      </p>

      <Show when={expanded()}>
        <div class="option-detail">
          <For each={paragraphs()}>{(paragraph) => <p>{paragraph}</p>}</For>
          <Show when={repeatable()}>
            <p class="option-note">May be taken up to {props.option.maxTimes} times.</p>
          </Show>
        </div>
      </Show>
    </li>
  )
}
