import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import test from 'node:test'
import { GROUP_LABELS, POPULAR_LABEL } from '../src/domain/catalogNavigation.mjs'
import {
  IN_STOCK_SLUGS,
  KEEP_OWN_TEXT,
  navigationRenames,
} from '../src/domain/ownerCatalogFixes.mjs'
import {
  emptyFilter,
  facetOptions,
  fromSearch,
  POPULAR,
  results,
  sectionStep,
  toQuery,
  update,
} from '../src/lib/catalogFilter.ts'

// Node читает TypeScript без сборки; разрешаем внутренний импорт проверяемого модуля.
const hooks = registerHooks({
  resolve(specifier, context, next) {
    return next(
      specifier === './rel' && context.parentURL?.includes('/src/lib/')
        ? new URL(`${specifier}.ts`, context.parentURL).href
        : specifier,
      context,
    )
  },
})
const { setupOwnerCatalogFixes } = await import('../src/lib/ownerCatalogFixes.ts')
hooks.deregister()

const item = (id, title, direction, extra = {}) => ({
  id,
  title,
  group: 'software',
  directions: [direction],
  types: [],
  vendor: `Производитель ${id}`,
  tasks: [],
  rank: 0,
  main: direction,
  scope: 'all',
  picture: null,
  ...extra,
})
const items = [
  item(1, 'Программа 1', 'arch'),
  item(2, 'Программа 2', 'mep'),
  item(3, 'Сканер', null, { group: 'hardware', directions: [], types: ['scanners'] }),
]
const facets = [
  ...['arch', 'mep'].map((slug) => ({ slug, title: slug, group: 'software', isDirection: true })),
  { slug: 'scanners', title: '3D-сканеры', group: 'hardware', isDirection: false },
]

test('Вкладки каталога и меню называются одинаково, «Популярные решения» — в адресе', () => {
  assert.equal(POPULAR_LABEL, 'Популярные решения')
  assert.deepEqual(Object.keys(GROUP_LABELS), ['software', 'hardware', 'service'])
  const popular = update(emptyFilter, { group: POPULAR })
  assert.equal(toQuery(popular), 'group=popular')
  assert.deepEqual(fromSearch('?group=popular'), popular)
  assert.equal(fromSearch('?group=unknown').group, null)
  // Во вкладке популярных товаров и шагов нет: показываются плитки.
  assert.equal(results(items, popular, facets).total, 0)
  assert.equal(sectionStep(items, facets, popular), null)
  const options = facetOptions(items, facets, popular)
  assert.deepEqual(options.directions, [])
  assert.deepEqual(options.types, [])
})

test('Сортировки больше нет: старая ссылка с ?sort открывает обычный порядок', () => {
  const state = fromSearch('?group=hardware&type=plotters&sort=price-desc')
  assert.equal('sort' in state, false)
  assert.equal(toQuery(state), 'group=hardware&type=plotters')
})

test('Как в меню: в направлении программ нет типов оборудования, в типе — направлений', () => {
  const direction = facetOptions(items, facets, { ...emptyFilter, direction: 'arch' })
  assert.deepEqual(direction.types, [])
  assert.ok(direction.directions.length > 0)
  const type = facetOptions(items, facets, { ...emptyFilter, group: 'hardware', type: 'scanners' })
  assert.deepEqual(type.directions, [])
})

test('У программ фильтра по характеристикам нет', () => {
  const software = {
    ...item(4, 'AutoCAD', 'arch'),
    research: { category: 'software', filters: { deployment: ['Локальная'] } },
  }
  const options = facetOptions([...items, software], facets, { ...emptyFilter, direction: 'arch' })
  assert.deepEqual(options.features, [])
  const state = fromSearch('?direction=arch&spec.software.deployment=Локальная')
  assert.deepEqual(state.features, {})
})

test('Программы начинаются с плиток направлений', () => {
  const step = sectionStep(items, facets, { ...emptyFilter, group: 'software' })
  assert.equal(step.kind, 'direction')
  assert.deepEqual(
    step.tiles.map((x) => x.slug),
    ['arch', 'mep'],
  )
})

test('Отчёт переименования разбирается в пары «было → стало»', () => {
  assert.deepEqual(
    navigationRenames([
      'Комплектующие → Расходные материалы для плоттеров',
      'Раздел training отсутствует — пропущен',
      'Плоттеры → Плоттеры',
      42,
    ]),
    [{ from: 'Комплектующие', to: 'Расходные материалы для плоттеров' }],
  )
  assert.deepEqual(navigationRenames(null), [])
})

test('Решения владельца: названия и тексты из истории, TZ-30000 в наличии, один раз', async () => {
  assert.deepEqual(KEEP_OWN_TEXT, ['scad_v23', 'autocad'])
  assert.deepEqual(IN_STOCK_SLUGS, ['imageprograf_tz_30000'])
  const runs = new Map([
    [
      'catalog-setup:navigation-v1',
      { snapshot: { report: ['Комплектующие → Расходные материалы для плоттеров'] } },
    ],
  ])
  const writes = []
  const payload = {
    find: async ({ collection, where }) => {
      if (collection === 'import-runs') {
        const run = runs.get(where.idempotencyKey.equals)
        return { docs: run ? [run] : [] }
      }
      if (collection === 'sections')
        return { docs: [{ id: 7, title: 'Расходные материалы для плоттеров' }] }
      if (collection === 'products')
        return {
          docs: [
            { id: 1, slug: 'scad_v23', title: 'SCAD Office v. 25.1', researchData: { a: 1 } },
            {
              id: 2,
              slug: 'imageprograf_tz_30000',
              title: 'imagePROGRAF TZ-30000',
              researchData: { category: 'plotters', status: 'discontinued', replacedBy: 'x' },
            },
          ],
        }
      if (collection === 'assistant-knowledge')
        return {
          docs: [{ id: 9, text: 'Плоттер. Сравнение.\nСнят с производства. Замена: TZ-32000.' }],
        }
      return { docs: [] }
    },
    findVersions: async ({ collection }) => ({
      docs:
        collection === 'sections'
          ? [
              { version: { title: 'Расходные материалы для плоттеров', summary: 'Новое' } },
              { version: { title: 'Комплектующие', summary: 'Картриджи и тонеры' } },
            ]
          : [
              { version: { researchData: { a: 1 }, description: 'Текст исследования' } },
              {
                version: {
                  researchData: null,
                  summary: 'Своё кратко',
                  description: 'Своё описание',
                  properties: [{ id: 'x', name: 'Важно', value: 'Да' }],
                },
              },
            ],
    }),
    update: async (call) => {
      writes.push(call)
    },
    create: async ({ data }) => {
      runs.set(data.idempotencyKey, data)
    },
  }
  const report = await setupOwnerCatalogFixes(payload)
  assert.ok(report.length > 0)
  const section = writes.find((x) => x.collection === 'sections')
  assert.deepEqual(section.data, { title: 'Комплектующие', summary: 'Картриджи и тонеры' })
  const scad = writes.find((x) => x.collection === 'products' && x.id === 1)
  assert.equal(scad.data.description, 'Своё описание')
  assert.deepEqual(scad.data.properties, [{ name: 'Важно', value: 'Да' }])
  const tz = writes.find((x) => x.collection === 'products' && x.id === 2)
  assert.equal(tz.data.researchData.status, 'in-stock')
  assert.equal(tz.data.researchData.replacedBy, null)
  const notes = writes.filter((x) => x.collection === 'assistant-knowledge')
  assert.ok(notes.some((x) => x.data.active === false))
  assert.ok(notes.some((x) => /из наличия/.test(x.data.text) && !/Снят/.test(x.data.text)))
  const count = writes.length
  assert.equal(await setupOwnerCatalogFixes(payload), null)
  assert.equal(writes.length, count)
})
