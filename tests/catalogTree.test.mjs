import assert from 'node:assert/strict'
import test from 'node:test'
import { vendorTree } from '../src/domain/catalogTree.mjs'

const titles = new Map([
  [1, 'Autodesk'],
  [2, 'SCAD Soft'],
  [3, 'Fine'],
])
const item = (title, vendor, more = {}) => ({
  title,
  vendor,
  rank: 1,
  line: null,
  lineOrder: null,
  ...more,
})
const order = (tree) => tree.map((vendor) => vendor.title)

test('производители без «Сорт.»: по топам продаж, потом по названию — как раньше', () => {
  const tree = vendorTree(
    [item('GEO5', 3), item('SCAD Office', 2), item('AutoCAD', 1, { rank: 109 })],
    [],
    titles,
  )
  assert.deepEqual(order(tree), ['Autodesk', 'Fine', 'SCAD Soft'])
})

test('«Сорт.» производителя важнее топов продаж, пустой — после заданных', () => {
  const tree = vendorTree(
    [
      item('AutoCAD', 1, { rank: 109 }),
      item('SCAD Office', 2, { vendorOrder: 20 }),
      item('GEO5', 3, { vendorOrder: 10 }),
    ],
    [],
    titles,
  )
  assert.deepEqual(order(tree), ['Fine', 'SCAD Soft', 'Autodesk'])
})

test('«Первыми в разделе» важнее «Сорт.» производителя', () => {
  const tree = vendorTree(
    [item('SCAD Office', 2, { vendorOrder: 20 }), item('GEO5', 3, { vendorOrder: 10 })],
    [],
    titles,
    [2],
  )
  assert.deepEqual(order(tree), ['SCAD Soft', 'Fine'])
})

test('товары без производителя — последними, даже при «Сорт.» у остальных', () => {
  const tree = vendorTree(
    [item('Без производителя', null), item('GEO5', 3, { vendorOrder: 500 })],
    [],
    titles,
  )
  assert.deepEqual(order(tree), ['Fine', 'Другие производители'])
})
