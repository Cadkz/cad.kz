import assert from 'node:assert/strict'
import test from 'node:test'
import { courseTopic } from '../src/domain/courseTopics.mjs'
import { DIRECTION_ORDER, remapSections } from '../src/domain/directionsNine.mjs'
import { collectionFor, linePickFor, pinPicks } from '../src/domain/vendorPicks.mjs'

test('курсы по категориям (27.10.2026)', () => {
  const key = (title, dirs) => courseTopic(title, dirs).key
  assert.equal(key('Курс «Расчет в ПК LIRA-FEM согласно Евронормам СП РК EN» с нуля'), 'structural')
  assert.equal(key('Autodesk Revit MEP: слаботочные сети'), 'mep')
  assert.equal(key('Курс Autodesk Revit Архитектурные интерьеры'), 'bim')
  assert.equal(key('Онлайн курс Civil 3D. Проектирование наружных инженерных сетей'), 'infra')
  assert.equal(key('Курс визуализация в 3Ds max + V ray с использованием Unreal Engine 5'), 'viz')
  assert.equal(key('Корпоративное обучение'), 'corporate')
  assert.equal(key('Autodesk Advance Steel. Базовый курс'), 'structural')
  assert.equal(key('Курс без программы', ['geotech']), 'structural')
  assert.equal(key('Курс без программы'), 'other')
})

test('влитые направления: разделы без повторов', () => {
  const moves = new Map([[9, 2]])
  assert.deepEqual(remapSections(9, [2, 5], moves), { main: 2, extra: [5], changed: true })
  assert.deepEqual(remapSections(3, [9, 2], moves), { main: 3, extra: [2], changed: true })
  assert.equal(remapSections(3, [5], moves).changed, false)
})

test('подборки: MagiCAD первым, AEC вторым, по две строки', () => {
  const key = (x) => x
  assert.equal(linePickFor('AutoCAD'), 'MagiCAD для AutoCAD')
  assert.equal(linePickFor('AutoCAD LT'), null)
  assert.deepEqual(pinPicks(['a', 'b', 'c'], { first: 'm', second: 'aec' }, key), ['m', 'aec'])
  assert.deepEqual(pinPicks(['a', 'aec', 'c'], { second: 'aec' }, key), ['a', 'aec'])
  assert.deepEqual(pinPicks([], { second: 'aec' }, key), ['aec'])
  assert.deepEqual(pinPicks(['a', 'b', 'c'], {}, key), ['a', 'b'])
})

test('Inventor и Fusion — вторым PDMC, AutoCAD и Revit — AEC Collection', () => {
  const aec = 'Architecture Engineering & Construction Collection'
  const pdmc = 'Product Design & Manufacturing Collection'
  for (const title of ['Inventor Professional', 'Fusion 360 Team', 'Vault Professional'])
    assert.ok(collectionFor(title).test(pdmc), title)
  for (const title of ['AutoCAD', 'Revit', 'Civil 3D', '3ds Max'])
    assert.ok(collectionFor(title).test(aec), title)
})

test('Направления: САПР и BIM первыми, сметы после геотехники', () => {
  const order = Object.entries(DIRECTION_ORDER)
    .sort((a, b) => a[1] - b[1])
    .map(([slug]) => slug)
  assert.deepEqual(order.slice(0, 5), ['arch', 'structural', 'geotech', 'estimate', 'machine'])
})
