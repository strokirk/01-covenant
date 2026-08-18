import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  balanceSheet,
  emptyWealth,
  expenditure,
  formatPounds,
  income,
  labPoints,
  laborerSaving,
  pointsOfInhabitants,
  pointsOfLaboratories,
  requiredStaff,
} from './wealth.ts'
import type { Wealth } from './wealth.ts'

function wealthWith(patch: Partial<Wealth>): Wealth {
  return { ...emptyWealth(), ...patch }
}

test('inhabitant points follow the season', () => {
  const inhabitants = { ...emptyWealth().inhabitants, magi: 2, companions: 1, horses: 3 }
  // Spring/Winter: 2 magi (5) + 1 companion (3) + 3 horses (1) = 16
  assert.equal(pointsOfInhabitants(wealthWith({ inhabitants })), 16)
  // Summer/Autumn: 2 magi (10) + 1 companion (5) + 3 horses (still 1) = 28
  assert.equal(
    pointsOfInhabitants(wealthWith({ inhabitants, season: 'summer-autumn' })),
    28,
  )
})

test('laboratory points match the table, and the formula beyond +2', () => {
  assert.equal(labPoints(-5), 1)
  assert.equal(labPoints(0), 10)
  assert.equal(labPoints(2), 30)
  // "increasing the Upkeep from +2 to +3 increases the number of points by 30"
  assert.equal(labPoints(3), 60)
  assert.equal(labPoints(4), 100)
  assert.equal(labPoints(5), 150)
  // "a lab with an Upkeep of +15 equates to 1200 points"
  assert.equal(labPoints(15), 1200)
})

test('laboratory use multiplies maintenance points', () => {
  const base = { id: 'a', label: 'Lab', upkeep: 0 }
  assert.equal(pointsOfLaboratories(wealthWith({ laboratories: [{ ...base, use: 'light' }] })), 5)
  assert.equal(pointsOfLaboratories(wealthWith({ laboratories: [{ ...base, use: 'typical' }] })), 10)
  assert.equal(pointsOfLaboratories(wealthWith({ laboratories: [{ ...base, use: 'heavy' }] })), 15)
})

test('required servants and teamsters', () => {
  // 6 magi in a Spring covenant = 30 points, needing 2 servants per 10 points.
  const wealth = wealthWith({})
  assert.equal(requiredStaff(wealth).servants, 6)

  // Laborers make teamsters redundant: each subtracts 2 from the teamster base.
  const withLaborers = wealthWith({
    inhabitants: { ...emptyWealth().inhabitants, laborers: 10 },
  })
  assert.ok(requiredStaff(withLaborers).teamsters < requiredStaff(wealth).teamsters)
})

test('the four staple categories cost exactly 1 lb per point of inhabitants', () => {
  // The book states this identity: Buildings + Consumables + Provisions +
  // Wages = 1 pound per point of inhabitants.
  const wealth = wealthWith({
    inhabitants: { ...emptyWealth().inhabitants, magi: 4, grogs: 12, servants: 7 },
  })
  const lines = expenditure(wealth, [])
  const staples = ['buildings', 'consumables', 'provisions', 'wages']
  const total = lines
    .filter((line) => staples.includes(line.id))
    .reduce((sum, line) => sum + line.pounds, 0)
  assert.equal(total, pointsOfInhabitants(wealth))
})

test('fortifications boons add to the buildings line', () => {
  const wealth = wealthWith({})
  const boon = {
    id: 'x',
    name: 'Curtain Walls',
    category: 'fortifications',
    categoryLabel: 'Fortifications',
    kind: 'boon',
    magnitude: 'major',
    points: 3,
    maxTimes: 1,
    description: '',
    source: { book: '', chunk: '', line: 0 },
  } as const
  const plain = expenditure(wealth, []).find((line) => line.id === 'buildings')!
  const fortified = expenditure(wealth, [boon]).find((line) => line.id === 'buildings')!
  assert.equal(fortified.pounds - plain.pounds, 5)
})

test('writing materials count magi and scribes', () => {
  const wealth = wealthWith({ scribes: 2 })
  const line = expenditure(wealth, []).find((entry) => entry.id === 'writing')!
  assert.equal(line.pounds, 8) // 6 magi + 2 scribes
})

test('income adjusts by 15 lb per magus either side of six', () => {
  assert.equal(income(wealthWith({})).total, 100)

  const eight = wealthWith({ inhabitants: { ...emptyWealth().inhabitants, magi: 8 } })
  assert.equal(income(eight).total, 130)

  const four = wealthWith({ inhabitants: { ...emptyWealth().inhabitants, magi: 4 } })
  assert.equal(income(four).total, 70)
})

test('a covenant on Lesser sources alone adjusts by 6 lb per magus', () => {
  const wealth = wealthWith({
    incomeSources: [
      { id: 'a', label: 'One', category: 'lesser' },
      { id: 'b', label: 'Two', category: 'lesser' },
    ],
    inhabitants: { ...emptyWealth().inhabitants, magi: 7 },
  })
  assert.equal(income(wealth).total, 86) // 40 + 40 + 6
})

test('laborers save a pound each, capped at half of provisions', () => {
  // 6 magi = 30 points, so Provisions is 15 lb and the cap is 7.5.
  const many = wealthWith({ inhabitants: { ...emptyWealth().inhabitants, laborers: 100 } })
  const provisions = (pointsOfInhabitants(many) / 10) * 5
  assert.equal(laborerSaving(many), provisions / 2)

  const few = wealthWith({ inhabitants: { ...emptyWealth().inhabitants, laborers: 2 } })
  assert.equal(laborerSaving(few), 2)
})

test('the balance sheet nets savings off expenditure', () => {
  const wealth = wealthWith({ inhabitants: { ...emptyWealth().inhabitants, laborers: 3 } })
  const sheet = balanceSheet(wealth, [])
  assert.equal(sheet.net, sheet.income - (sheet.expenditure - sheet.savings))
})

test('pounds format without trailing noise', () => {
  assert.equal(formatPounds(12), '12')
  assert.equal(formatPounds(12.25), '12.3')
  assert.equal(formatPounds(0.5), '0.5')
})
