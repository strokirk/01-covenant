import { For, Show } from 'solid-js'
import './OptionCard.css'
import { magnitudeLabel } from '../data.ts'
import { countOf as formatCount } from '../lib/text.ts'
import { adjust, countOf, expandedId, setExpandedId, toggle } from '../store.ts'
import type { BoonHook } from '../types.ts'
import { Badge } from './ui/Badge.tsx'
import { Button } from './ui/Button.tsx'

export function OptionCard(props: { option: BoonHook }) {
  const count = () => countOf(props.option.id)
  const expanded = () => expandedId() === props.option.id
  const paragraphs = () => props.option.description.split('\n\n')
  const repeatable = () => props.option.maxTimes > 1

  return (
    <li class="option" classList={{ 'is-selected': count() > 0 }}>
      <div class="option-head">
        <Button
          variant="bare"
          class="option-toggle"
          aria-pressed={count() > 0}
          onClick={() => toggle(props.option.id)}
        >
          <span class="option-name">{props.option.name}</span>
          <Show when={props.option.qualifier}>
            <span class="option-qualifier">({props.option.qualifier})</span>
          </Show>
        </Button>

        <Badge tone={props.option.kind}>{magnitudeLabel(props.option)}</Badge>
        <Show when={props.option.points > 0}>
          <Badge>{formatCount(props.option.points, 'pt')}</Badge>
        </Show>

        <Show when={repeatable() && count() > 0}>
          <span class="stepper">
            <Button
              onClick={() => adjust(props.option.id, -1)}
              aria-label={`Take ${props.option.name} one fewer time`}
            >
              −
            </Button>
            <span class="stepper-count">×{count()}</span>
            <Button
              onClick={() => adjust(props.option.id, 1)}
              disabled={count() >= props.option.maxTimes}
              aria-label={`Take ${props.option.name} one more time`}
            >
              +
            </Button>
          </span>
        </Show>

        <Button
          class="is-small"
          aria-expanded={expanded()}
          onClick={() => setExpandedId(expanded() ? null : props.option.id)}
        >
          {expanded() ? 'Less' : 'More'}
        </Button>
      </div>

      <p class="option-summary" classList={{ 'is-hidden': expanded() }}>
        {paragraphs()[0]}
      </p>

      <Show when={expanded()}>
        <div class="option-detail">
          <For each={paragraphs()}>{(paragraph) => <p>{paragraph}</p>}</For>
          <Show when={repeatable()}>
            <p class="option-note">
              May be taken up to {formatCount(props.option.maxTimes, 'time')}.
            </p>
          </Show>
        </div>
      </Show>
    </li>
  )
}
