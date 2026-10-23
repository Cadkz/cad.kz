import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import test from 'node:test'
import facets from '../src/domain/equipmentFacets.json' with { type: 'json' }
import { EQUIPMENT_FILTERS_V2, mergeFilters } from '../src/domain/equipmentFiltersV2.mjs'
import source from '../src/domain/equipmentResearch.json' with { type: 'json' }
import { KEEP_OWN_TEXT } from '../src/domain/ownerCatalogFixes.mjs'
import {
  autoVendor,
  emptyFilter,
  featureOptions,
  fromParams,
  fromSearch,
  matches,
  pruneVendors,
  results,
  sectionStep,
  toQuery,
  update,
} from '../src/lib/catalogFilter.ts'
import { lifecycle, readResearch } from '../src/lib/equipmentResearch.ts'

// Node читает TypeScript без сборки; разрешаем внутренние импорты проверяемых модулей.
const hooks = registerHooks({
  resolve(specifier, context, next) {
    return next(
      ['./rel', './catalogFilter', './plural'].includes(specifier) &&
        context.parentURL?.includes('/src/lib/')
        ? new URL(`${specifier}.ts`, context.parentURL).href
        : specifier,
      context,
    )
  },
})
const { setupEquipmentResearch, EQUIPMENT_RESEARCH_KEY, researchDescription } = await import(
  '../src/lib/equipmentResearchSetup.ts'
)
hooks.deregister()

/** Фильтры товара на сайте: исследование плюс замена групп плоттеров и сканеров (23.10.2026). */
function siteFilters(category, seed) {
  const next = EQUIPMENT_FILTERS_V2[category]?.[seed.slug]
  return next ? mergeFilters(category, seed.filters, next) : seed.filters
}

const items = source.products.map((seed, index) => {
  const category = source.categories.find((entry) => entry.order.includes(seed.slug)).category
  return {
    id: index + 1,
    title: seed.title,
    slug: seed.slug,
    group: category === 'software' ? 'software' : 'hardware',
    types: category === '3d-scanners' ? ['scanners'] : ['wide-format', category],
    directions: category === 'software' ? ['machine'] : [],
    vendor: 'Производитель',
    scope: 'all',
    tasks: [],
    rank: 0,
    main: category,
    line: null,
    lineOrder: index,
    research: readResearch({ category, ...seed, filters: siteFilters(category, seed) }),
  }
})
const plotters = { ...emptyFilter, group: 'hardware', type: 'plotters' }
const features = (state, values) => update(state, { features: values })

test('Все 54 товара перенесены; у каждого значения фильтра есть группа и вариант', () => {
  assert.equal(items.length, 54)
  assert.equal(new Set(items.map((item) => item.slug)).size, 54)
  // Группы плоттеров и сканеров заменены по образцу владельца, остальные — из исследования.
  const replaced = Object.keys(EQUIPMENT_FILTERS_V2)
  assert.deepEqual(
    facets.filter((entry) => !replaced.includes(entry.category)),
    source.categories
      .filter((entry) => !replaced.includes(entry.category))
      .map(({ category, filters }) => ({ category, filters })),
  )
  for (const category of replaced) {
    const order = source.categories.find((entry) => entry.category === category).order
    assert.deepEqual(Object.keys(EQUIPMENT_FILTERS_V2[category]).sort(), [...order].sort())
  }
  for (const category of facets) {
    for (const item of items.filter((item) => item.research.category === category.category)) {
      for (const filter of category.filters) {
        for (const value of item.research.filters[filter.key] ?? []) {
          assert.ok(filter.values.includes(value), `${item.slug}: ${filter.key}=${value}`)
        }
      }
      for (const key of Object.keys(item.research.filters)) {
        assert.ok(
          category.filters.some((filter) => filter.key === key),
          `${item.slug}: группа ${key}`,
        )
      }
    }
  }
})

test('Группы следуют исследованию; бесполезные одиночные признаки скрыты', () => {
  const options = featureOptions(items, plotters)
  assert.deepEqual(
    options.map((entry) => entry.label),
    [
      'Максимальный формат печати',
      'Технология печати',
      'Цвет печати',
      'Разрешение печати, dpi',
      'Скорость печати, макс.',
      'Рулоны: максимум с опциями',
      'Назначение',
    ],
  )
  const narrowed = featureOptions(items, features(plotters, { 'plotters.color': ['Монохромная'] }))
  const technology = narrowed.find((entry) => entry.key === 'plotters.technology')
  assert.equal(technology, undefined)
  assert.ok(narrowed.every((entry) => entry.options.every((option) => option.count > 0)))
})

test('Галочки: ИЛИ внутри группы, И между группами, массивы значений поддерживаются', () => {
  const state = features(plotters, {
    'plotters.color': ['Цветная', 'Монохромная'],
    'plotters.purpose': ['Постеры'],
  })
  const found = items.filter((item) => matches(item, state))
  assert.ok(found.length > 0)
  assert.ok(found.every((item) => item.research.filters.purpose.includes('Постеры')))
  assert.equal(results(items, plotters).total, 11)
  assert.equal(
    items.filter((item) =>
      matches(item, features(plotters, { 'plotters.color': ['Цветная', 'Монохромная'] })),
    ).length,
    11,
  )
})

test('Нулевой выбранный вариант остаётся доступен для снятия; производитель не сбрасывается', () => {
  const state = features(
    { ...plotters, vendors: ['Производитель'] },
    {
      'plotters.color': ['Монохромная'],
      'plotters.technology': ['Струйная пигментная'],
    },
  )
  assert.equal(results(items, state).total, 0)
  const color = featureOptions(items, state).find((entry) => entry.key === 'plotters.color')
  assert.equal(color.options.find((entry) => entry.value === 'Монохромная').count, 0)
  assert.deepEqual(pruneVendors(items, state).vendors, state.vendors)
})

test('Каждый шаг восстанавливается из URL; кавычки, кириллица и несколько значений не теряются', () => {
  const states = [plotters]
  states.push(features(states.at(-1), { 'plotters.format': ['A0 (36″, 914 мм)', 'A0+ (42–44″)'] }))
  states.push(
    features(states.at(-1), {
      ...states.at(-1).features,
      'plotters.purpose': ['САПР/ГИС', 'Постеры'],
    }),
  )
  for (const state of [...states, ...states.toReversed()])
    assert.deepEqual(fromSearch(toQuery(state)), state)
  assert.deepEqual(
    fromParams({
      type: 'plotters',
      'spec.plotters.format': 'неизвестно',
      'spec.software.license': 'Подписка',
    }).features,
    {},
  )
})

test('Смена раздела сбрасывает характеристики и страницу; производитель сохраняет выбор', () => {
  const state = { ...features(plotters, { 'plotters.format': ['A0+ (42–44″)'] }), page: 3 }
  for (const change of [{ type: 'scanners' }, { group: 'software' }, { direction: 'machine' }]) {
    assert.deepEqual(update(state, change).features, {})
    assert.equal(update(state, change).page, 1)
  }
  assert.deepEqual(update(state, { vendors: ['Canon'] }).features, state.features)
  assert.equal(update(state, { features: {} }).page, 1)
})

test('scanners использует 3d-scanners; у ПО, Iridium и родителя фильтров нет', () => {
  assert.equal(
    featureOptions(items, { ...emptyFilter, type: 'scanners' })[0].key,
    '3d-scanners.object_size',
  )
  // Решение владельца 23.10.2026: у программ фильтра по характеристикам нет.
  assert.deepEqual(featureOptions(items, { ...emptyFilter, group: 'software' }), [])
  assert.deepEqual(featureOptions(items, { ...emptyFilter, direction: 'machine' }), [])
  for (const type of ['wide-format', 'workstations', null])
    assert.deepEqual(featureOptions(items, { ...emptyFilter, type }), [])
})

test('Характеристики не подставляют случайного единственного производителя', () => {
  const sample = items
    .filter((item) => item.research.category === 'plotters')
    .map((item, i) => ({ ...item, vendor: i === 0 ? 'Первый' : 'Второй' }))
  assert.deepEqual(autoVendor(sample, features(plotters, { 'plotters.rolls': ['2'] })).vendors, [])
})

test('Плитки типов и подразделов остаются отдельным шагом', () => {
  const sections = [
    { slug: 'wide-format', title: 'Плоттеры', group: 'hardware', isDirection: false },
    { slug: 'scanners', title: '3D', group: 'hardware', isDirection: false },
    {
      slug: 'plotters',
      title: 'Плоттеры',
      parent: 'wide-format',
      group: 'hardware',
      isDirection: false,
    },
    {
      slug: 'consumables',
      title: 'Комплектующие',
      parent: 'wide-format',
      group: 'hardware',
      isDirection: false,
    },
  ]
  assert.equal(sectionStep(items, sections, { ...emptyFilter, group: 'hardware' }).kind, 'type')
  assert.equal(sectionStep(items, sections, { ...emptyFilter, type: 'wide-format' }).kind, 'sub')
  assert.equal(sectionStep(items, sections, plotters), null)
})

test('Снятая модель: существующая замена — ссылка, Artec Point II — текст', () => {
  const replacements = new Map([['artec_eva', { title: 'Artec Eva', href: '/products/artec_eva' }]])
  assert.equal(
    lifecycle(items.find((item) => item.slug === 'artec_eva_lite').research, replacements)
      .replacement.href,
    '/products/artec_eva',
  )
  assert.deepEqual(
    lifecycle(items.find((item) => item.slug === 'artec_point').research, replacements).replacement,
    { title: 'Artec Point II', href: null },
  )
  assert.equal(lifecycle(items[0].research, replacements), null)
  assert.equal(readResearch(null), null)
})

function fixture() {
  const products = items.map((item) => ({
    id: item.id,
    slug: item.slug,
    title: `Исходное ${item.title}`,
    lineOrder: 100 - item.id,
    mainSection: { id: 4 },
    extraSections: [{ id: 5 }],
    properties: [
      { name: 'Артикул', value: 'ABC' },
      { name: 'Важно', value: 'Старое' },
    ],
  }))
  const stores = { products, 'assistant-knowledge': [], 'import-runs': [] }
  let failAt = null
  const writes = []
  const payload = {
    async find({ collection, where }) {
      return {
        docs: stores[collection].filter(
          (entry) =>
            !where || Object.entries(where).every(([key, filter]) => entry[key] === filter.equals),
        ),
      }
    },
    async update({ collection, id, data }) {
      if (id === failAt && collection === 'products') throw new Error('Обрыв')
      writes.push({ collection, data })
      Object.assign(
        stores[collection].find((entry) => entry.id === id),
        data,
      )
    },
    async create({ collection, data }) {
      stores[collection].push({ id: stores[collection].length + 1, ...data })
    },
  }
  return {
    payload,
    stores,
    writes,
    fail: (id) => {
      failAt = id
    },
  }
}

test('Разовая настройка сохраняет названия, порядок и разделы; повтор не пишет', async () => {
  const f = fixture()
  const before = f.stores.products.map(({ title, lineOrder }) => ({ title, lineOrder }))
  const report = await setupEquipmentResearch(f.payload)
  // SCAD и AutoCAD владелец оставил со своими текстами (23.10.2026).
  assert.equal(f.stores['assistant-knowledge'].length, 54 - KEEP_OWN_TEXT.length)
  assert.equal(f.stores['import-runs'][0].idempotencyKey, EQUIPMENT_RESEARCH_KEY)
  assert.ok(report.some((line) => line.startsWith('Название не меняли:')))
  assert.deepEqual(
    f.stores.products.map(({ title, lineOrder }) => ({ title, lineOrder })),
    before,
  )
  for (const product of f.stores.products.filter((p) => !KEEP_OWN_TEXT.includes(p.slug))) {
    assert.equal(product.mainSection, 4)
    assert.deepEqual(product.extraSections, [5])
    assert.deepEqual(product.properties[0], { name: 'Артикул', value: 'ABC' })
    assert.ok(product.description.includes('\n\n## '))
    assert.ok(product.properties.some((property) => property.name.includes(' — ')))
  }
  assert.ok(f.stores['assistant-knowledge'].every((entry) => entry.text.length <= 2000))
  const writes = f.writes.length
  assert.equal(await setupEquipmentResearch(f.payload), null)
  assert.equal(f.writes.length, writes)
})

test('Повтор после сбоя не дублирует сравнения; пропуски отражаются в отчёте', async () => {
  const f = fixture()
  f.fail(5)
  await assert.rejects(setupEquipmentResearch(f.payload), /Обрыв/)
  assert.equal(f.stores['import-runs'].length, 0)
  f.fail(null)
  await setupEquipmentResearch(f.payload)
  assert.equal(f.stores['assistant-knowledge'].length, 54 - KEEP_OWN_TEXT.length)
  const missing = fixture()
  missing.stores.products.pop()
  const report = await setupEquipmentResearch(missing.payload)
  assert.ok(report.some((line) => line.startsWith('Не найден товар:')))
  assert.equal(missing.stores['import-runs'].length, 0)
})

test('Описание сохраняет абзацы, подзаголовки и списки', () => {
  assert.equal(
    researchDescription({
      overview: ['Первый', 'Второй'],
      sections: [{ title: 'Блок', text: 'Текст', bullets: ['Один', 'Два'] }],
    }),
    'Первый\n\nВторой\n\n## Блок\n\nТекст\n\n- Один\n- Два',
  )
})

test('Сканеры: формат, разрешение, скорость и цветность ровными значениями; старые группы стёрты', () => {
  const scanners = { ...emptyFilter, group: 'hardware', type: 'wide-scanners' }
  const labels = featureOptions(items, scanners).map((entry) => entry.label)
  for (const label of [
    'Максимальный формат сканирования',
    'Разрешение сканирования, dpi',
    'Скорость сканирования',
    'Цветность сканирования, бит',
  ])
    assert.ok(labels.includes(label), label)
  assert.ok(!labels.includes('Ширина сканирования'))
  const wide = items.filter((item) =>
    matches(item, features(scanners, { 'wide-scanners.format': ['A0+ (44–48″)'] })),
  )
  assert.equal(wide.length, 3)
  assert.deepEqual(
    mergeFilters('plotters', { width: '44"', rolls: '2', color: 'Цветной' }, { color: 'Цветная' }),
    { rolls: '2', color: 'Цветная' },
  )
})
