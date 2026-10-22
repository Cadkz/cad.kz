import assert from 'node:assert/strict'
import test from 'node:test'
import { CATALOG_CATEGORIES } from '../src/domain/catalogNavigation.mjs'
import { compareCatalog } from '../src/domain/catalogSort.mjs'
import {
  emptyFilter,
  facetOptions,
  fromSearch,
  results,
  sectionStep,
  toQuery,
  update,
} from '../src/lib/catalogFilter.ts'
import { setupCatalogNavigation } from '../src/lib/catalogNavigationSetup.ts'

const item = (id, title, direction, priceFrom) => ({
  id,
  title,
  priceFrom,
  group: 'software',
  directions: [direction],
  types: [],
  vendor: `Производитель ${id}`,
  tasks: [],
  rank: 0,
  main: direction,
  scope: 'all',
  picture: null,
})
const items = [
  item(1, 'Программа 10', 'arch', '10 000 ₸'),
  item(2, 'Программа 2', 'mep', '2\u00a0000 ₸'),
  item(3, 'По запросу', 'arch', null),
]
const facets = ['arch', 'mep'].map((slug) => ({
  slug,
  title: slug,
  group: 'software',
  isDirection: true,
}))

test('Сортировка цены: неизвестные суммы в конце в обоих направлениях, названия — естественно', () => {
  assert.deepEqual(
    [...items].sort(compareCatalog('price-asc')).map((x) => x.id),
    [2, 1, 3],
  )
  assert.deepEqual(
    [...items].sort(compareCatalog('price-desc')).map((x) => x.id),
    [1, 2, 3],
  )
  assert.deepEqual(
    [...items.slice(0, 2)].sort(compareCatalog('name')).map((x) => x.id),
    [2, 1],
  )
  const state = { ...emptyFilter, sort: 'price-asc' }
  assert.deepEqual(
    results(items, state, facets).items.map((x) => x.id),
    [2, 1, 3],
  )
})

test('Сортировка сохраняется в ссылке, сбрасывает страницу; категории очищают уточнения', () => {
  const initial = {
    ...emptyFilter,
    group: 'hardware',
    type: 'plotters',
    vendors: ['Canon'],
    page: 3,
  }
  const sorted = update(initial, { sort: 'price-desc' })
  assert.equal(sorted.page, 1)
  assert.deepEqual(fromSearch(toQuery(sorted)), sorted)
  assert.equal(fromSearch('?sort=bad').sort, 'recommended')
  const category = update(sorted, { group: 'software', direction: 'arch' })
  assert.equal(category.direction, 'arch')
  assert.equal(category.type, null)
  assert.equal(category.sort, 'recommended')
  assert.deepEqual(category.vendors, [])
  assert.deepEqual(fromSearch(toQuery(initial)), initial)
})

test('Программы начинаются с категорий, соседние категории доступны после выбора производителя', () => {
  const state = { ...emptyFilter, group: 'software' }
  const step = sectionStep(items, facets, state)
  assert.equal(step.kind, 'direction')
  assert.deepEqual(
    step.tiles.map((x) => x.slug),
    ['arch', 'mep'],
  )
  assert.equal(sectionStep(items, facets, { ...state, sort: 'name' }), null)
  const selected = { ...state, direction: 'arch', vendors: ['Производитель 1'] }
  assert.deepEqual(
    facetOptions(items, facets, selected).directions.map((x) => x.value),
    ['arch', 'mep'],
  )
})

test('Названия категорий обновляются один раз, без изменения адресов и товаров', async () => {
  let done = false
  const writes = []
  const payload = {
    find: async ({ collection }) => ({
      docs:
        collection === 'import-runs'
          ? done
            ? [{}]
            : []
          : CATALOG_CATEGORIES.map((s, id) => ({ ...s, id })),
    }),
    update: async (data) => {
      writes.push(data)
    },
    create: async ({ data }) => {
      assert.equal(data.idempotencyKey, 'catalog-setup:navigation-v1')
      done = true
    },
  }
  assert.ok((await setupCatalogNavigation(payload)).length > 0)
  assert.equal(writes.length, CATALOG_CATEGORIES.length)
  assert.ok(
    writes.every(
      (x) =>
        x.collection === 'sections' && Object.keys(x.data).sort().join(',') === 'summary,title',
    ),
  )
  assert.equal(await setupCatalogNavigation(payload), null)
  assert.equal(writes.length, CATALOG_CATEGORIES.length)
})
