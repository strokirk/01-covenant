#!/usr/bin/env node
// Splits the large rulebook markdown files in reference/ into per-section
// chunks under reference/chunks/, so that specific rules can be looked up
// without loading a 2.4 MB file.
//
// Usage: node scripts/split-reference.mjs

import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const referenceDir = join(root, 'reference')
const chunksDir = join(referenceDir, 'chunks')

/** Books to split, and the heading depth at which to cut each one. */
const books = [
  { file: 'Ars Magica 5e - Covenants.md', slug: 'covenants', splitDepth: 2 },
  { file: 'Ars Magica - Definitive Edition (Core Rules).md', slug: 'core', splitDepth: 2 },
]

/** Turns a heading into a filesystem-safe slug. */
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'section'
}

/**
 * Splits markdown into sections at headings of depth <= splitDepth.
 * Content before the first such heading becomes a "front matter" section.
 */
function splitSections(markdown, splitDepth) {
  const lines = markdown.split('\n')
  const sections = []
  let current = { heading: 'Front matter', depth: 0, startLine: 1, lines: [] }
  let inFence = false

  for (const [index, line] of lines.entries()) {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence

    const match = inFence ? null : line.match(/^(#{1,6})\s+(.*\S)\s*$/)
    if (match && match[1].length <= splitDepth) {
      if (current.lines.some((l) => l.trim() !== '')) sections.push(current)
      current = {
        heading: match[2].replace(/\\/g, ''),
        depth: match[1].length,
        startLine: index + 1,
        lines: [line],
      }
    } else {
      current.lines.push(line)
    }
  }
  if (current.lines.some((l) => l.trim() !== '')) sections.push(current)
  return sections
}

/** Collects the sub-headings inside a section, for the index. */
function subHeadings(sectionLines, splitDepth) {
  const found = []
  let inFence = false
  for (const line of sectionLines) {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence
    if (inFence) continue
    const match = line.match(/^(#{1,6})\s+(.*\S)\s*$/)
    if (match && match[1].length === splitDepth + 1) found.push(match[2].replace(/\\/g, ''))
  }
  return found
}

// Everything under chunks/ is generated and safe to discard. Curated notes
// belong in reference/REFERENCE-INDEX.md, outside this directory, so that a
// regeneration can never clobber hand-written content.
rmSync(chunksDir, { recursive: true, force: true })
mkdirSync(chunksDir, { recursive: true })

const manifest = []

for (const book of books) {
  // The source books are CRLF; normalize so downstream regexes (where `.`
  // does not match a carriage return) behave.
  const source = readFileSync(join(referenceDir, book.file), 'utf8').replace(/\r\n?/g, '\n')
  const sections = splitSections(source, book.splitDepth)
  const bookDir = join(chunksDir, book.slug)
  mkdirSync(bookDir, { recursive: true })

  const seen = new Map()
  for (const [index, section] of sections.entries()) {
    let slug = slugify(section.heading)
    const count = (seen.get(slug) ?? 0) + 1
    seen.set(slug, count)
    if (count > 1) slug = `${slug}-${count}`

    const name = `${String(index).padStart(2, '0')}-${slug}.md`
    const body = section.lines.join('\n').replace(/\n+$/, '') + '\n'
    writeFileSync(join(bookDir, name), body)

    manifest.push({
      book: book.file,
      bookSlug: book.slug,
      path: `reference/chunks/${book.slug}/${name}`,
      heading: section.heading,
      sourceLine: section.startLine,
      lines: section.lines.length,
      bytes: Buffer.byteLength(body),
      subHeadings: subHeadings(section.lines, book.splitDepth),
    })
  }
}

writeFileSync(join(chunksDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n')

const totals = books.map((book) => {
  const own = manifest.filter((entry) => entry.bookSlug === book.slug)
  return `${book.slug}: ${own.length} sections`
})
console.log(`Wrote ${manifest.length} chunks (${totals.join(', ')}) to reference/chunks/`)
