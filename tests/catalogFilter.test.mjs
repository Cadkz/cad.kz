import assert from 'node:assert/strict'
import test from 'node:test'
import {
  emptyFilter,
  facetOptions,
  fromParams,
  results,
  toQuery,
  update,
} from '../src/lib/catalogFilter.ts'

const item = (id, group, directions, types, vendor, tasks) => ({
  id,
  group,
  directions,
  types,
  vendor,
  tasks,
  title: `T${id}`,
})
const items = [
  item(1, 'software', ['arch'], [], 'Autodesk', ['BIM']),
  item(2, 'software', ['arch'], [], 'Autodesk', ['2D']),
  item(3, 'software', ['geotech'], [], 'Fine', ['Откосы']),
  item(4, 'hardware', ['machine'], ['scanners'], 'Artec', ['Скан']),
  item(5, 'hardware', [], ['plotters'], 'Canon', ['Печать']),
]
const facets = [
  { slug: 'arch', title: 'Архитектура', group: 'software', isDirection: true },
  { slug: 'geotech', title: 'Геотехника', group: 'software', isDirection: true },
  { slug: 'machine', title: 'Машиностроение', group: 'software', isDirection: true },
  { slug: 'scanners', title: '3D-сканеры', group: 'hardware', isDirection: false },
  { slug: 'plotters', title: 'Плоттеры', group: 'hardware', isDirection: false },
]

test('direction narrows results and reveals tasks', () => {
  const state = update(emptyFilter, { direction: 'arch' })
  assert.equal(results(items, state).total, 2)
  const options = facetOptions(items, facets, state)
  assert.deepEqual(
    options.tasks.map((t) => t.value),
    ['2D', 'BIM'],
  )
  assert.deepEqual(options.vendors, [{ value: 'Autodesk', label: 'Autodesk', count: 2 }])
})

test('facet counts ignore their own selection', () => {
  const state = update(emptyFilter, { direction: 'arch' })
  const arch = facetOptions(items, facets, state).directions.find((d) => d.value === 'geotech')
  assert.equal(arch.count, 1)
})

test('changing group resets lower levels of the cascade', () => {
  const state = update(update(emptyFilter, { direction: 'arch', vendors: ['Autodesk'] }), {
    group: 'hardware',
  })
  assert.equal(state.direction, null)
  assert.deepEqual(state.vendors, [])
  assert.equal(results(items, state).total, 2)
  assert.deepEqual(facetOptions(items, facets, state).directions, [])
})

test('state survives a round trip through the address bar', () => {
  const state = {
    ...emptyFilter,
    group: 'software',
    direction: 'arch',
    tasks: ['BIM', '2D'],
    page: 2,
  }
  const params = Object.fromEntries(
    [...new URLSearchParams(toQuery(state))].reduce((map, [k, v]) => {
      map.set(k, map.has(k) ? [].concat(map.get(k), v) : v)
      return map
    }, new Map()),
  )
  assert.deepEqual(fromParams(params), state)
  assert.equal(fromParams({ group: 'evil', page: '-3' }).group, null)
  assert.equal(fromParams({ page: '-3' }).page, 1)
})
