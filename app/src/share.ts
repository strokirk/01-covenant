import { optionsById } from './data.ts'
import type { Covenant } from './types.ts'

/**
 * A covenant travels in the URL hash, so it needs a compact, URL-safe
 * encoding. base64url over the JSON keeps it readable enough to debug while
 * surviving copy/paste through chat clients that mangle raw JSON.
 */
function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text)
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('')
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(encoded: string): string {
  const padded = encoded.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, '='))
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

/** Drops unknown ids and non-positive counts from untrusted input. */
export function sanitize(input: Partial<Covenant> | null | undefined): Covenant {
  return {
    name: typeof input?.name === 'string' ? input.name.slice(0, 120) : '',
    selections: Object.fromEntries(
      Object.entries(input?.selections ?? {}).flatMap(([id, count]) => {
        const option = optionsById.get(id)
        if (!option || typeof count !== 'number' || !Number.isFinite(count)) return []
        const clamped = Math.min(Math.max(Math.floor(count), 0), option.maxTimes)
        return clamped > 0 ? [[id, clamped] as const] : []
      }),
    ),
  }
}

export function encodeCovenant(covenant: Covenant): string {
  return toBase64Url(JSON.stringify(covenant))
}

export function decodeCovenant(encoded: string): Covenant | null {
  try {
    return sanitize(JSON.parse(fromBase64Url(encoded)) as Partial<Covenant>)
  } catch {
    return null
  }
}

/** Reads a shared covenant out of the current URL hash, if there is one. */
export function covenantFromHash(): Covenant | null {
  const hash = location.hash.replace(/^#/, '')
  const match = hash.match(/^c=(.+)$/)
  return match ? decodeCovenant(match[1]) : null
}

export function shareUrl(covenant: Covenant): string {
  return `${location.origin}${location.pathname}#c=${encodeCovenant(covenant)}`
}
