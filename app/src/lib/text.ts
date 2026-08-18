/** `1 point` / `2 points`, without the caller assembling the string twice. */
export function plural(count: number, singular: string, many = `${singular}s`): string {
  return count === 1 ? singular : many
}

/** `1 point`, `3 points`. */
export function countOf(count: number, singular: string, many?: string): string {
  return `${count} ${plural(count, singular, many)}`
}

/** Filesystem- and URL-safe form of a name. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
