#!/usr/bin/env node
// End-to-end smoke test against a built app.
//
//   npm run build
//   npm run preview &            # serves http://localhost:4173/01-covenant/
//   npm i -D playwright --no-save
//   npm run smoke
//
// Playwright is deliberately not a saved dependency: the Pages workflow runs
// `npm ci`, and pulling browsers there would cost minutes per deploy for a
// check CI does not run.
//
// Set CHROMIUM_PATH to use an already-installed Chromium instead of one
// downloaded by Playwright. BASE_URL overrides the server address.

import { chromium } from 'playwright'

const baseUrl = process.env.BASE_URL ?? 'http://localhost:4173/01-covenant/'

let failures = 0

function check(label, actual, expected) {
  const pass = typeof expected === 'function' ? expected(actual) : actual === expected
  if (!pass) failures++
  const detail = typeof expected === 'function' ? actual : `${actual} (want ${expected})`
  console.log(`${pass ? 'ok  ' : 'FAIL'}  ${label}: ${detail}`)
}

const tally = (page) =>
  page.locator('.balance-tally').innerText().then((text) => text.replace(/\n/g, ' '))

const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
)
const errors = []

try {
  const context = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] })
  const page = await context.newPage()
  page.on('pageerror', (error) => errors.push(String(error)))
  page.on('console', (message) => message.type() === 'error' && errors.push(message.text()))
  page.on('dialog', (dialog) => dialog.accept())

  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  check('options render', await page.locator('.option').count(), (n) => n > 0)

  // --- balance arithmetic -------------------------------------------------
  await page.locator('.option-toggle', { hasText: 'Natural Fortress' }).first().click()
  check('one Major Boon', await tally(page), '3 Boon pts vs 0 Hook pts')

  await page.locator('.kind-filter .btn', { hasText: 'Hooks' }).click()
  await page.locator('.option-toggle').first().click()
  check('balanced', await page.locator('.balance-verdict').innerText(), (t) => t.includes('Balanced'))

  // --- repeatable options -------------------------------------------------
  await page.locator('.kind-filter .btn', { hasText: 'All' }).click()
  await page.fill('.search', 'aura')
  const aura = page
    .locator('.option', { hasText: 'The magic aura of the covenant increases' })
    .first()
  await aura.locator('.option-toggle').click()
  await aura.locator('.stepper .btn', { hasText: '+' }).click()
  check('stepper counts up', (await aura.locator('.stepper-count').innerText()).trim(), '×2')

  // --- persistence --------------------------------------------------------
  const before = await tally(page)
  await page.reload({ waitUntil: 'networkidle' })
  check('survives reload', await tally(page), before)

  // --- sharing ------------------------------------------------------------
  await page.fill('.covenant-name', 'Semita Errabunda')
  await page.locator('.actions .btn', { hasText: 'Copy share link' }).click()
  const shared = await page.evaluate(() => navigator.clipboard.readText())

  const fresh = await (await browser.newContext()).newPage()
  fresh.on('pageerror', (error) => errors.push(`shared: ${error}`))
  await fresh.goto(shared, { waitUntil: 'networkidle' })
  check('shared name', await fresh.inputValue('.covenant-name'), 'Semita Errabunda')
  check('shared selections', await tally(fresh), before)

  // A corrupt hash must degrade to an empty covenant, not a blank page.
  const corrupt = await (await browser.newContext()).newPage()
  corrupt.on('pageerror', (error) => errors.push(`corrupt: ${error}`))
  await corrupt.goto(`${baseUrl}#c=not-valid-base64!!`, { waitUntil: 'networkidle' })
  check('corrupt hash recovers', await corrupt.locator('.option').count(), (n) => n > 0)

  // --- situations ---------------------------------------------------------
  await page.locator('.btn-ghost').click()
  check('situations listed', await page.locator('.situation').count(), 18)

  await page.locator('.situation-name', { hasText: 'Autumn Power' }).click()
  const autumn = page.locator('.situation', { hasText: 'Autumn Power' })
  check('uneven package warns', await autumn.locator('.situation-warning').count(), 1)
  check('unmatched entries listed', await autumn.locator('.situation-missing li').count(), (n) => n > 0)

  // Every package must apply without throwing.
  const applyButtons = page.locator('.situation-head .btn', { hasText: 'Use' })
  const total = await applyButtons.count()
  for (let index = 0; index < total; index++) {
    await applyButtons.nth(index).click()
    await page.waitForTimeout(50)
    await page.locator('.btn-ghost').click()
  }
  check('all situations apply', total, 18)

  check('no console errors', errors.length === 0, (ok) => (ok ? 'none' : errors.join('; ')))
} finally {
  await browser.close()
}

console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) failed.`)
process.exit(failures === 0 ? 0 : 1)
