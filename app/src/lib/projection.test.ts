import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  defaultModifiers,
  project,
  sanitizeModifiers,
  yearAffordable,
} from './projection.ts'
import type { ProjectionInput } from './projection.ts'

function input(patch: Partial<ProjectionInput> = {}): ProjectionInput {
  return {
    baseIncome: 100,
    baseExpenditure: 90,
    startingInflation: 0,
    startingStores: 0,
    modifiers: defaultModifiers(5),
    ...patch,
  }
}

test('status quo leaves income where it was', () => {
  const years = project(input())
  assert.equal(years.length, 5)
  assert.ok(years.every((year) => year.income === 100))
})

test('five years of Expansion grow a Typical source towards a Greater one', () => {
  // The book: "five years of Expansion results in a Typical source of income
  // growing to become equivalent to a Greater source" — Typical is 100 lb,
  // Greater is 250. 100 * 1.2^5 = 248.8.
  const years = project(input({ modifiers: Array(5).fill('expansion') }))
  const final = years.at(-1)!.income
  assert.ok(final > 240 && final < 260, `expected about 250, got ${final}`)
})

test('modifiers compound rather than applying to the original', () => {
  const years = project(input({ modifiers: ['boom', 'boom'] }))
  assert.equal(years[0].income, 150)
  assert.equal(years[1].income, 225)
})

test('a slump halves income for good', () => {
  const years = project(input({ modifiers: ['slump', 'status-quo'] }))
  assert.equal(years[0].income, 50)
  assert.equal(years[1].income, 50)
})

test('inflation starts where it was and rises with expenditure', () => {
  const years = project(input({ modifiers: defaultModifiers(3) }))
  // Year one pays the inflation already on the books — nothing in year one
  // of a new covenant.
  assert.equal(years[0].inflation, 0)
  assert.equal(years[0].expenditure, 90)
  // Then about a pound per hundred pounds of the previous year's spending.
  assert.equal(years[1].inflation, 0.9)
  assert.ok(years[2].inflation > years[1].inflation)
})

test('stores accumulate the yearly net', () => {
  const years = project(input({ startingStores: 20 }))
  assert.equal(years[0].stores, 30) // 20 + (100 − 90)
  assert.ok(years[1].stores > years[0].stores)
})

test('a covenant spending beyond its means drains its stores', () => {
  const years = project(input({ baseExpenditure: 150, startingStores: 100 }))
  assert.ok(years[0].net < 0)
  assert.ok(years.at(-1)!.stores < 100)
})

test('reports the first year an outlay becomes affordable', () => {
  const years = project(input({ startingStores: 0 }))
  // 10 lb a year, less rising inflation, so 30 lb takes more than three years.
  assert.equal(yearAffordable(years, 10), 1)
  assert.equal(yearAffordable(years, 10_000), null)
})

test('untrusted modifier lists are rebuilt safely', () => {
  assert.deepEqual(sanitizeModifiers(['boom', 'nonsense']), ['boom', 'status-quo'])
  assert.equal(sanitizeModifiers('nope').length, 5)
  assert.equal(sanitizeModifiers([]).length, 5)
})
