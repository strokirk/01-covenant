#!/usr/bin/env node
// Extracts the Boons & Hooks of Covenants chapter two into structured JSON
// for the app to consume. Derived programmatically (rather than typed by
// hand) so the data stays auditable against the source text.
//
// Usage: node scripts/extract-boons-hooks.mjs

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const chunkDir = join(root, 'reference/chunks/covenants')
const outFile = join(root, 'app/src/data/boons-hooks.json')

/** The six Boon/Hook categories of Covenants chapter two, in book order. */
const categories = [
  { id: 'site', label: 'Site', chunk: '07-site.md' },
  { id: 'fortifications', label: 'Fortifications', chunk: '08-fortifications.md' },
  { id: 'resources', label: 'Resources', chunk: '09-resources.md' },
  { id: 'residents', label: 'Residents', chunk: '10-residents.md' },
  { id: 'external-relations', label: 'External Relations', chunk: '11-external-relations.md' },
  { id: 'surroundings', label: 'Surroundings', chunk: '12-surroundings.md' },
]

/** Reads a `### ...` heading into { magnitude, kind }, or null if it isn't one. */
function parseGroupHeading(heading) {
  if (/free choices?$/i.test(heading)) return { magnitude: 'free', kind: 'free' }
  const match = heading.match(/^(Major|Minor)\s+.*?(Boons?|Hooks?)$/i)
  if (!match) return null
  return {
    magnitude: match[1].toLowerCase(),
    kind: match[2].toLowerCase().startsWith('boon') ? 'boon' : 'hook',
  }
}

/**
 * Matches an entry opener: `**Name:** text`, `**Name**: text`, or
 * `**Name** (requires Castle): text` — the colon sits inside or outside the
 * bold depending on the entry. A colon in one of those two spots is what
 * distinguishes an entry from a paragraph that merely starts with bold text,
 * so a match with neither is rejected below.
 */
const entryPattern =
  /^\*\*(?<name>[^*]+?)\s*(?<innerColon>:)?\*\*\s*(?<qualifier>\([^)]*\))?\s*(?<outerColon>:)?\s*(?<rest>.*)$/

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

/** Best-effort detection of Boons the rules allow taking more than once. */
function detectMaxTimes(description) {
  const words = { twice: 2, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, ten: 10 }
  const match = description.match(
    /(?:may be (?:taken|selected)|may take this (?:Boon|Hook)|take this (?:Boon|Hook))[^.]*?\b(?:up to\s+)?(twice|two|three|four|five|six|seven|eight|ten|\d+)\b[^.]*?times?/i,
  )
  if (!match) return 1
  return words[match[1].toLowerCase()] ?? Number(match[1]) ?? 1
}

const entries = []

for (const category of categories) {
  const path = join(chunkDir, category.chunk)
  const lines = readFileSync(path, 'utf8').replace(/\r\n?/g, '\n').split('\n')

  let group = null
  let current = null

  const flush = () => {
    if (!current) return
    const description = current.paragraphs
      .map((paragraph) => paragraph.join(' ').replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .join('\n\n')
    entries.push({
      // Several options share a name across magnitudes (Aura, Regio and
      // Immunity are each both a Major and a Minor Site Boon), so the id
      // needs magnitude as well as kind to stay unique.
      id: `${category.id}--${slugify(current.name)}--${current.magnitude}-${current.kind}`,
      name: current.name,
      category: category.id,
      categoryLabel: category.label,
      kind: current.kind,
      magnitude: current.magnitude,
      points: { major: 3, minor: 1, free: 0 }[current.magnitude],
      qualifier: current.qualifier,
      maxTimes: current.kind === 'boon' ? detectMaxTimes(description) : 1,
      description,
      source: {
        book: 'Ars Magica 5e - Covenants',
        chunk: `reference/chunks/covenants/${category.chunk}`,
        line: current.line,
      },
    })
    current = null
  }

  for (const [index, line] of lines.entries()) {
    // Sidebars are blockquoted; they hold advice, not selectable options.
    if (line.startsWith('>')) continue

    const headingMatch = line.match(/^(#{2,4})\s+(.*\S)\s*$/)
    if (headingMatch) {
      flush()
      group = headingMatch[1].length === 3 ? parseGroupHeading(headingMatch[2]) : null
      continue
    }
    if (!group) continue

    const entryMatch = line.match(entryPattern)
    if (entryMatch && (entryMatch.groups.innerColon || entryMatch.groups.outerColon)) {
      flush()
      const { name, qualifier, rest } = entryMatch.groups
      current = {
        name: name.trim(),
        kind: group.kind === 'free' ? 'free' : group.kind,
        magnitude: group.magnitude,
        qualifier: qualifier ? qualifier.slice(1, -1) : undefined,
        line: index + 1,
        paragraphs: [[rest]],
      }
      continue
    }

    if (!current) continue
    if (line.trim() === '') current.paragraphs.push([])
    else current.paragraphs.at(-1).push(line.trim())
  }
  flush()
}

const duplicates = entries
  .map((entry) => entry.id)
  .filter((id, index, all) => all.indexOf(id) !== index)
if (duplicates.length > 0) {
  throw new Error(`Duplicate entry ids: ${[...new Set(duplicates)].join(', ')}`)
}

writeFileSync(outFile, JSON.stringify(entries, null, 2) + '\n')

const summary = {}
for (const entry of entries) {
  const key = `${entry.magnitude} ${entry.kind}`
  summary[key] = (summary[key] ?? 0) + 1
}
console.log(`Wrote ${entries.length} entries to app/src/data/boons-hooks.json`)
for (const [key, count] of Object.entries(summary).sort()) console.log(`  ${key}: ${count}`)
