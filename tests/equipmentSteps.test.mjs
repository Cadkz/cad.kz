import assert from 'node:assert/strict'
import test from 'node:test'
import { EQUIPMENT_SECTIONS, FLAGSHIP_ORDER, flagshipOrder } from '../src/domain/equipmentSeed.mjs'
import { emptyFilter, facetOptions, sectionStep, update } from '../src/lib/catalogFilter.ts'

const item = (id, title, types, vendor, picture = null) => ({
  id,
  title,
  group: 'hardware',
  directions: [],
  types,
  vendor,
  tasks: [],
  rank: 0,
  main: types[types.length - 1],
  scope: 'all',
  picture,
})
const photo = { url: '/p.png', alt: '', width: 10, height: 10, fit: 'photo' }
const items = [
  item(1, 'Artec Leo', ['scanners'], 'Artec 3D', photo),
  item(2, 'Artec Eva', ['scanners'], 'Artec 3D'),
  item(3, 'PlotWave 7500', ['wide-format', 'plotters'], 'Canon', photo),
  item(4, 'Тонер T60', ['wide-format', 'consumables'], 'Canon'),
  item(5, 'WideTEK 36', ['wide-scanners'], 'WideTEK'),
  item(6, 'Iridium Line', ['workstations'], null),
]
const hw = (slug, title, parent) => ({
  slug,
  title,
  group: 'hardware',
  isDirection: false,
  ...(parent ? { parent } : {}),
})
const facets = [
  hw('scanners', '3D-сканеры'),
  hw('wide-format', 'Широкоформатные плоттеры'),
  hw('wide-scanners', 'Широкоформатные сканеры'),
  hw('workstations', 'Рабочие станции'),
  hw('plotters', 'Плоттеры', 'wide-format'),
  hw('consumables', 'Комплектующие', 'wide-format'),
]
const hardware = update(emptyFilter, { group: 'hardware' })

test('оборудование: сначала четыре типа плитками, с фото первого товара', () => {
  const step = sectionStep(items, facets, hardware)
  assert.equal(step?.kind, 'type')
  assert.deepEqual(
    step.tiles.map((t) => [t.slug, t.count]),
    [
      ['scanners', 2],
      ['wide-format', 2],
      ['wide-scanners', 1],
      ['workstations', 1],
    ],
  )
  assert.equal(step.tiles[0].picture, photo)
  assert.deepEqual(step.tiles[1].children, ['Плоттеры', 'Комплектующие'])
  assert.deepEqual(step.tiles[0].vendors, ['Artec 3D'])
})

test('широкоформатные плоттеры: подразделы плитками, у подраздела шага нет', () => {
  const sub = sectionStep(items, facets, update(hardware, { type: 'wide-format' }))
  assert.equal(sub?.kind, 'sub')
  assert.deepEqual(
    sub.tiles.map((t) => t.title),
    ['Плоттеры', 'Комплектующие'],
  )
  assert.equal(sectionStep(items, facets, update(hardware, { type: 'plotters' })), null)
  assert.equal(sectionStep(items, facets, update(hardware, { type: 'scanners' })), null)
  assert.equal(sectionStep(items, facets, update(hardware, { vendors: ['Canon'] })), null)
})

test('в списке типов нет подразделов, у открытого подраздела отмечен родитель', () => {
  const options = facetOptions(items, facets, update(hardware, { type: 'plotters' }))
  assert.equal(options.typeSelected, 'wide-format')
  assert.deepEqual(
    options.types.map((t) => t.value),
    ['scanners', 'wide-format', 'wide-scanners', 'workstations'],
  )
})

test('разделы оборудования: подразделы только внутри «Широкоформатных плоттеров»', () => {
  const tops = EQUIPMENT_SECTIONS.filter((s) => !s.parent).map((s) => s.title)
  assert.deepEqual(tops, [
    '3D-сканеры',
    'Широкоформатные плоттеры',
    'Широкоформатные сканеры',
    'Рабочие станции',
  ])
  const subs = EQUIPMENT_SECTIONS.filter((s) => s.parent)
  assert.ok(subs.every((s) => s.parent === 'wide-format'))
})

test('флагманы первыми: порядок с шагом 10, без повторов', () => {
  assert.equal(new Set(FLAGSHIP_ORDER).size, FLAGSHIP_ORDER.length)
  assert.equal(flagshipOrder('plotwave_7500'), 10)
  assert.equal(flagshipOrder('imageprograf_tx_3200'), 110)
  assert.equal(flagshipOrder('artec_leo'), null)
})
