import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { test } from 'node:test'
import { BRANDS, brandOf } from '../src/domain/brands.mjs'

test('плитки списка владельца узнаются по названию', () => {
  const titles = [
    'AutoCAD',
    'Revit',
    'АВС-KZ',
    'GEO5',
    'SCAD Office',
    'ЛИРА-FEM',
    'Fusion',
    '3D-сканеры Artec',
  ]
  assert.deepEqual(
    titles.map((title) => brandOf(title)?.key),
    ['autocad', 'revit', 'abc', 'geo5', 'scad', 'lira', 'fusion', 'artec'],
  )
  assert.equal(brandOf('Inventor'), null)
})

test('у каждого бренда есть файл логотипа', () => {
  for (const brand of BRANDS) assert.ok(existsSync(`public${brand.logo}`), brand.logo)
})
