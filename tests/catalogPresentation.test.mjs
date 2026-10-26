import assert from 'node:assert/strict'
import test from 'node:test'
import { GROUP_LABELS } from '../src/domain/catalogNavigation.mjs'
import { collectionInfo, entryType } from '../src/domain/catalogPresentation.mjs'
import {
  browseState,
  emptyFilter,
  facetOptions,
  fromSearch,
  results,
  toQuery,
  update,
} from '../src/lib/catalogFilter.ts'

const facets = [
  { slug: 'estimates', title: 'Сметы', isDirection: true, group: 'software' },
  { slug: 'training', title: 'Обучение', isDirection: true, group: 'service' },
  { slug: 'scanners', title: '3D-сканеры', isDirection: false, group: 'hardware' },
]
const items = [
  {
    id: 1,
    title: 'АВС-KZ',
    group: 'software',
    directions: ['estimates'],
    types: [],
    vendor: 'АВС',
    tasks: [],
    scope: 'all',
    line: '1',
  },
  {
    id: 2,
    title: 'AutoCAD',
    group: 'software',
    directions: ['estimates'],
    types: [],
    vendor: 'Autodesk',
    tasks: [],
    scope: 'all',
    line: '2',
  },
  {
    id: 3,
    title: 'Artec Leo',
    group: 'hardware',
    directions: [],
    types: ['scanners'],
    vendor: 'Artec',
    tasks: [],
    scope: 'all',
    line: '3',
  },
  {
    id: 4,
    title: 'Курс Revit',
    group: 'service',
    directions: [],
    types: ['training'],
    vendor: 'CAD.kz',
    tasks: [],
    scope: 'all',
    line: null,
  },
]

test('порядок и названия верхних разделов общие', () => {
  assert.deepEqual(Object.values(GROUP_LABELS), [
    'Программы',
    'Оборудование',
    'Обучение и внедрение',
  ])
})
test('в небольшом направлении сразу товары обоих производителей', () => {
  const state = browseState(fromSearch('?direction=estimates'), facets, true)
  assert.deepEqual(
    results(items, state, facets).items.map((item) => item.title),
    ['АВС-KZ', 'AutoCAD'],
  )
  assert.equal(facetOptions(items, facets, state).vendors.length, 2)
})
test('обучение не попадает в направления программ, доступно отдельной группой', () => {
  assert.deepEqual(
    facetOptions(items, facets, { ...emptyFilter, group: 'software' }).directions.map(
      (f) => f.value,
    ),
    ['estimates'],
  )
  const state = browseState(fromSearch('?type=training'), facets, true)
  assert.equal(state.group, 'service')
  assert.equal(results(items, state).items[0].title, 'Курс Revit')
  assert.equal(facetOptions(items, facets, state).types[0].value, 'training')
})
test('все старые параметры сохраняются в адресе и восстанавливают каждый шаг', () => {
  const history = [
    '?group=hardware',
    '?group=hardware&type=scanners',
    '?type=scanners&vendor=Artec&line=3',
    '?direction=estimates&vendor=АВС&line=1',
  ]
  for (const url of history) {
    const state = fromSearch(url)
    assert.deepEqual(fromSearch(toQuery(state)), state)
    assert.ok(results(items, browseState(state, facets, true)).total > 0)
  }
  const first = browseState(fromSearch(history[0]), facets, true)
  const second = update(first, { type: 'scanners' })
  const third = update(second, { vendors: ['Artec'] })
  assert.deepEqual(fromSearch(toQuery(second)), second)
  assert.notDeepEqual(third, second)
  assert.equal(browseState(emptyFilter, facets, true).group, 'popular')
})
test('коллекции отличимы от программ и не путаются с чужим производителем', () => {
  for (const title of [
    'AEC Collection',
    'Architecture, Engineering & Construction Collection',
    'Product Design & Manufacturing Collection',
    'Media & Entertainment Collection',
  ]) {
    assert.equal(entryType({ title, kind: 'software' }), 'Коллекция')
    const info = collectionInfo({ title, manufacturer: 'Autodesk' })
    assert.ok(info.included.length > 5)
    assert.ok(info.source.startsWith('https://www.autodesk.com/'))
    assert.doesNotMatch(info.benefit, /\d+\s*%/)
  }
  assert.equal(collectionInfo({ title: 'AEC Collection', manufacturer: 'Другой' }), null)
  assert.equal(collectionInfo({ title: 'Revit' }), null)
  assert.equal(entryType({ title: 'Курс Revit', kind: 'course' }), 'Курс')
  assert.equal(entryType({ title: 'Artec Leo', kind: 'hardware' }), 'Оборудование')
  assert.equal(
    entryType({ title: 'Расширение', kind: 'software', requiresProducts: [1] }),
    'Модуль',
  )
  assert.equal(entryType({ title: 'Нормативная база РК', kind: 'software' }), 'Нормативная база')
  assert.equal(entryType({ title: 'AutoCAD', kind: 'software' }), 'Программа')
})

test('старое направление обучения открывает услуги, линейка без производителя показывает состав', () => {
  const state = browseState(fromSearch('?direction=training'), facets, true)
  assert.equal(state.direction, null)
  assert.equal(state.type, 'training')
  assert.equal(results(items, state).items[0].id, 4)
  const family = { ...items[0], id: -1, scope: 'family' }
  const detail = { ...items[0], id: 11, scope: 'detail' }
  assert.deepEqual(
    results([family, detail], fromSearch('?line=1')).items.map((item) => item.id),
    [11],
  )
})

test('переход из направления в семейство сохраняет задачу в обоих представлениях', () => {
  const family = { ...items[0], href: '/families/scad-satellites', directions: ['geotech'] }
  const found = results([family], fromSearch('?direction=geotech'))
  assert.equal(found.items[0].href, '/families/scad-satellites?task=geotech')
})
