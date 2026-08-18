#!/usr/bin/env node
// Extracts the ready-made Covenant Situations (Covenants ch. 2) into JSON,
// resolving each listed Boon/Hook back to an id in boons-hooks.json so the
// app can load a situation straight into the picker.
//
// Usage: node scripts/extract-situations.mjs

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const chunk = join(root, 'reference/chunks/covenants/13-covenant-situations.md')
const optionsFile = join(root, 'app/src/data/boons-hooks.json')
const outFile = join(root, 'app/src/data/situations.json')

const options = JSON.parse(readFileSync(optionsFile, 'utf8'))

/** Index options by normalized name so situation entries can be resolved. */
const byName = new Map()
for (const option of options) {
  const key = normalize(option.name)
  if (!byName.has(key)) byName.set(key, [])
  byName.get(key).push(option)
}

function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/**
 * The situation packages name options loosely — singular for plural, an
 * adjective the list omits. These are spelled out rather than fuzzy-matched
 * so that a wrong guess can't silently attach the wrong option (and its
 * points) to a covenant.
 */
const aliases = new Map(
  Object.entries({
    edifice: 'Edifices',
    'church territory': 'Church Territories',
    'curtain wall and mural towers': 'Curtain Walls and Mural Towers',
    wealthy: 'Wealth',
    'magical heavy cavalry': 'Heavy Cavalry',
  }).map(([from, to]) => [from, normalize(to)]),
)

/**
 * Splits a comma-separated option list, rejoining fragments so that names
 * containing a comma survive: every entry must end in a parenthetical.
 */
function splitEntries(line, kind) {
  // Free Choices carry no cost parenthetical, so there is nothing to rejoin
  // around — splitting plainly is both correct and necessary here.
  if (kind === 'free') return line.split(/,\s*/).map((part) => part.trim()).filter(Boolean)

  const parts = line.split(/,\s*/)
  const entries = []
  let pending = ''
  for (const part of parts) {
    pending = pending ? `${pending}, ${part}` : part
    if (/\)\s*$/.test(pending)) {
      entries.push(pending.trim())
      pending = ''
    }
  }
  if (pending.trim()) entries.push(pending.trim())
  return entries
}

/**
 * Reads one entry, e.g. `Edifice x2 (Minor)`, `Magical Heavy Cavalry
 * (Major x2)`, or `Wealth: Agriculture (Minor)`. A colon marks a
 * specialization of the named option ("Wealth" specialized to agriculture),
 * so the part before it is what resolves against the option list.
 */
function parseEntry(text, kind) {
  const match = text.match(/^(?<name>.+?)\s*(?:\((?<paren>[^)]*)\))?\s*$/)
  if (!match) return null

  let name = match.groups.name.trim()
  const paren = (match.groups.paren ?? '').trim()

  let count = 1
  const nameMultiplier = name.match(/\s+x\s*(\d+)$/i)
  if (nameMultiplier) {
    count = Number(nameMultiplier[1])
    name = name.slice(0, nameMultiplier.index).trim()
  }

  let magnitude = null
  const parenMatch = paren.match(/^(Major|Minor)(?:\s*x\s*(\d+))?$/i)
  if (parenMatch) {
    magnitude = parenMatch[1].toLowerCase()
    if (parenMatch[2]) count = Number(parenMatch[2])
  } else if (kind === 'free') {
    magnitude = 'free'
    // A Free Choice carries no magnitude, so any parenthetical is part of
    // the name rather than a cost.
    if (paren) name = `${name} (${paren})`
  }

  const [base, ...rest] = name.split(':')
  return {
    name: name.trim(),
    lookupName: base.trim(),
    specialization: rest.length > 0 ? rest.join(':').trim() : undefined,
    magnitude,
    kind,
    count,
  }
}

/**
 * Finds the option this entry refers to. Kind and magnitude must agree, and
 * the name must be unambiguous — the packages occasionally call something a
 * Boon that the lists call a Hook, and guessing there would corrupt the
 * point balance. Such entries stay unresolved for the reader to place.
 */
function resolve(entry) {
  const key = normalize(entry.lookupName)
  const candidates = byName.get(aliases.get(key) ?? key) ?? []
  const matches = candidates.filter(
    (option) =>
      option.kind === entry.kind &&
      (entry.magnitude === null || option.magnitude === entry.magnitude),
  )
  return matches.length === 1 ? matches[0].id : null
}

const lines = readFileSync(chunk, 'utf8').replace(/\r\n?/g, '\n').split('\n')
const situations = []
let current = null

const listPattern = /^\*\*(?<label>Hooks?|Boons?|Free)\s*:?\*\*\s*:?\s*(?<rest>.+)$/i

for (const line of lines) {
  if (line.startsWith('>')) continue

  const heading = line.match(/^###\s+(.*\S)\s*$/)
  if (heading) {
    current = {
      id: normalize(heading[1]).replace(/ /g, '-'),
      name: heading[1],
      description: [],
      entries: [],
    }
    situations.push(current)
    continue
  }
  if (!current) continue

  const list = line.match(listPattern)
  if (list) {
    const label = list.groups.label.toLowerCase()
    const kind = label.startsWith('hook') ? 'hook' : label.startsWith('boon') ? 'boon' : 'free'
    for (const text of splitEntries(list.groups.rest, kind)) {
      const entry = parseEntry(text, kind)
      if (entry) current.entries.push({ ...entry, optionId: resolve(entry) })
    }
    continue
  }

  if (line.trim()) current.description.push(line.trim())
}

for (const situation of situations) {
  situation.description = situation.description.join('\n\n')
  situation.boonPoints = tally(situation, 'boon')
  situation.hookPoints = tally(situation, 'hook')
}

function tally(situation, kind) {
  return situation.entries
    .filter((entry) => entry.kind === kind)
    .reduce((total, entry) => total + (entry.magnitude === 'major' ? 3 : 1) * entry.count, 0)
}

writeFileSync(outFile, JSON.stringify(situations, null, 2) + '\n')

const all = situations.flatMap((situation) => situation.entries)
const unresolved = all.filter((entry) => !entry.optionId)
console.log(`Wrote ${situations.length} situations (${all.length} entries) to situations.json`)
console.log(`Resolved ${all.length - unresolved.length}/${all.length} entries to option ids`)
if (unresolved.length > 0) {
  console.log('\nUnresolved:')
  for (const entry of unresolved) {
    console.log(`  ${entry.kind.padEnd(4)} ${String(entry.magnitude).padEnd(5)} ${entry.name}`)
  }
}
const unbalanced = situations.filter((s) => s.boonPoints !== s.hookPoints)
if (unbalanced.length > 0) {
  console.log('\nSituations whose listed Boons and Hooks do not tally:')
  for (const s of unbalanced) console.log(`  ${s.name}: ${s.boonPoints} boon / ${s.hookPoints} hook`)
}
