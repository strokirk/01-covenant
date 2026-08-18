import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  HOUSING_TYPE_ID,
  constructionTotals,
  emptyProject,
  landCost,
  laboratoryOutfitCost,
  projectCost,
  projectYears,
  sanitizeProjects,
} from './construction.ts'
import type { BuildingProject } from './construction.ts'

function project(patch: Partial<BuildingProject> = {}): BuildingProject {
  return { ...emptyProject('t'), ...patch }
}

test('catalogue prices are the standard, average-size cost', () => {
  assert.equal(projectCost(project({ typeId: 'house' })), 1)
  assert.equal(projectCost(project({ typeId: 'tower' })), 100)
  assert.equal(projectCost(project({ typeId: 'castle' })), 1000)
})

test('quality and size multiply together', () => {
  // "something that is both Huge and of Excellent quality has a total
  // multiplier of 25"
  const grand = project({ typeId: 'house', quality: 'excellent', size: 'excellent' })
  assert.equal(projectCost(grand), 25)

  // A Standard house of timber against a Superior one of stone.
  assert.equal(projectCost(project({ typeId: 'house', size: 'superior' })), 2)
  assert.equal(projectCost(project({ typeId: 'house', quality: 'shoddy' })), 0.5)
})

test('quantity scales the cost', () => {
  assert.equal(projectCost(project({ typeId: 'mill', quantity: 3 })), 15)
})

test('covenfolk quarters cost their points of inhabitants', () => {
  // "in a Spring covenant, a hut to house a servant costs one pound, whereas
  // the house of a magus costs five pounds"
  const hut = project({ typeId: HOUSING_TYPE_ID, housingPoints: 1 })
  const magusHouse = project({ typeId: HOUSING_TYPE_ID, housingPoints: 5 })
  assert.equal(projectCost(hut), 1)
  assert.equal(projectCost(magusHouse), 5)
})

test('rushing costs half again and halves the time', () => {
  const steady = project({ typeId: 'tower', floors: 4 })
  const rushed = project({ typeId: 'tower', floors: 4, rushed: true })
  assert.equal(projectCost(rushed), projectCost(steady) * 1.5)
  assert.equal(projectYears(steady), 4)
  assert.equal(projectYears(rushed), 2)
})

test('land costs ten pounds a virgate', () => {
  assert.equal(landCost(1), 10)
  assert.equal(landCost(4.5), 45)
  assert.equal(landCost(-3), 0)
})

test('outfitting a laboratory costs a pound per two points', () => {
  // "a standard laboratory with an Upkeep of 0 costs five pounds to build"
  assert.equal(laboratoryOutfitCost(10), 5)
  assert.equal(laboratoryOutfitCost(30), 15)
})

test('totals add the three strands and take the longest build', () => {
  const totals = constructionTotals(
    [project({ typeId: 'house', floors: 1 }), project({ typeId: 'tower', floors: 4 })],
    2,
    10,
  )
  assert.equal(totals.buildings, 101)
  assert.equal(totals.land, 20)
  assert.equal(totals.laboratories, 5)
  assert.equal(totals.total, 126)
  // Projects run in parallel, so the plan takes as long as its longest item.
  assert.equal(totals.years, 4)
})

test('untrusted project lists are rebuilt safely', () => {
  const cleaned = sanitizeProjects([
    { typeId: 'house', quantity: -5, quality: 'nonsense' },
    { typeId: 'not-a-building' },
    'rubbish',
    null,
  ])
  assert.equal(cleaned.length, 1)
  assert.equal(cleaned[0].quantity, 1)
  assert.equal(cleaned[0].quality, 'standard')
  assert.deepEqual(sanitizeProjects('nope'), [])
})
