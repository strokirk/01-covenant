import type { JSX } from 'solid-js'

/** Colored by what the badge describes: a Boon, a Hook, a Free Choice, or a bare fact. */
export type BadgeTone = 'boon' | 'hook' | 'free' | 'neutral'

export function Badge(props: { tone?: BadgeTone; children: JSX.Element }) {
  return <span class={`badge badge-${props.tone ?? 'neutral'}`}>{props.children}</span>
}
