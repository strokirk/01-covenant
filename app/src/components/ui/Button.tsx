import { splitProps } from 'solid-js'
import type { JSX } from 'solid-js'

/**
 * `chip` — bordered pill, the default for filters and actions.
 * `ghost` — dashed outline, for a section's disclosure control.
 * `link`  — underlined text, for inline secondary actions.
 * `bare`  — no chrome, for making a heading or label clickable.
 */
export type ButtonVariant = 'chip' | 'ghost' | 'link' | 'bare'

export type ButtonProps = JSX.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  /** Renders the pressed/selected state for filters and tabs. */
  active?: boolean
}

export function Button(props: ButtonProps) {
  const [local, rest] = splitProps(props, ['variant', 'active', 'class'])
  return (
    <button
      type="button"
      {...rest}
      class={`btn btn-${local.variant ?? 'chip'}${local.class ? ` ${local.class}` : ''}`}
      classList={{ 'is-active': local.active }}
    />
  )
}
