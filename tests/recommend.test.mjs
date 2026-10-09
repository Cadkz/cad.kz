import assert from 'node:assert/strict'
import test from 'node:test'
import { crossFor, similarFor } from '../src/domain/recommend.mjs'

// Разделы: 1 геотехника, 2 расчёт конструкций, 3 обучение, 4 внедрение, 5 плоттеры, 6 расходники.
const info = new Map([
  [1, { isDirection: true, cross: [3, 4] }],
  [2, { isDirection: true, cross: [3, 4] }],
  [3, { isDirection: false, cross: [] }],
  [4, { isDirection: false, cross: [] }],
  [5, { isDirection: false, cross: [6] }],
  [6, { isDirection: false, cross: [] }],
])

const item = (id, title, vendor, main, extra = [], more = {}) => ({
  id,
  title,
  vendor,
  kind: 'software',
  main,
  sections: [main, ...extra],
  requires: [],
  manualSimilar: [],
  manualCross: [],
  suggestSimilar: true,
  suggestCross: true,
  ...more,
})

const geoPiles = item(1, 'GEO5 Сваи', 'Fine', 1)
const geoWalls = item(2, 'GEO5 Стены', 'Fine', 1)
const scadSoil = item(3, 'SCAD ОТКОС', 'SCAD', 1, [2])
const scad = item(4, 'SCAD Office', 'SCAD', 2)
const liraCourse = item(5, 'Курс ЛИРА', null, 3, [2], { kind: 'course' })
const geoCourse = item(6, 'Курс геологии', null, 3, [1], { kind: 'course' })
const consulting = item(7, 'Внедрение BIM', null, 4, [], { kind: 'service' })
const plotter = item(8, 'Canon TX-3200', 'Canon', 5, [], { kind: 'hardware' })
const toner = item(9, 'Тонер TX', 'Canon', 6, [], { kind: 'hardware' })
const plugin = item(10, 'Плагин для SCAD', 'SCAD', 2, [], { requires: [4] })
const all = [
  geoPiles,
  geoWalls,
  scadSoil,
  scad,
  liraCourse,
  geoCourse,
  consulting,
  plotter,
  toner,
  plugin,
]

test('похожие: сначала тот же основной раздел, чужие разделы не попадают', () => {
  const result = similarFor(geoPiles, all)
  assert.equal(result[0], geoWalls.id)
  assert.ok(result.includes(scadSoil.id))
  assert.ok(!result.includes(plotter.id))
})

test('похожие: общий второй раздел у товаров разного типа не делает их похожими', () => {
  const scanner = item(11, 'Artec Leo', 'Artec', 3, [2], { kind: 'hardware' })
  const program = item(12, 'Inventor', 'Autodesk', 2)
  assert.deepEqual(similarFor(scanner, [scanner, program]), [])
})

test('похожие: ручной список первым, запрет «предлагать как похожий» работает', () => {
  const target = { ...geoPiles, manualSimilar: [scad.id] }
  assert.equal(similarFor(target, all)[0], scad.id)
  const hidden = all.map((p) => (p.id === geoWalls.id ? { ...p, suggestSimilar: false } : p))
  assert.ok(!similarFor(geoPiles, hidden).includes(geoWalls.id))
})

test('с этим покупают: курс своего направления, а не чужого', () => {
  const result = crossFor([geoPiles], all, info)
  assert.equal(result[0], geoCourse.id)
  assert.ok(result.includes(consulting.id))
  assert.ok(!result.includes(liraCourse.id))
})

test('с этим покупают: к плоттеру расходники, к программе плагин', () => {
  assert.deepEqual(crossFor([plotter], all, info), [toner.id])
  assert.equal(crossFor([scad], all, info)[0], plugin.id)
})

test('корзина: подборка по всем товарам без самих товаров корзины', () => {
  const result = crossFor([geoPiles, plotter], all, info, { limit: 5 })
  assert.ok(result.includes(toner.id))
  assert.ok(result.includes(geoCourse.id))
  assert.ok(!result.includes(geoPiles.id) && !result.includes(plotter.id))
})

test('запрет «предлагать в С этим покупают» и ручной список', () => {
  const noToner = all.map((p) => (p.id === toner.id ? { ...p, suggestCross: false } : p))
  assert.deepEqual(crossFor([plotter], noToner, info), [])
  assert.equal(crossFor([{ ...plotter, manualCross: [scad.id] }], all, info)[0], scad.id)
})
