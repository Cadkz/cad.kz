import assert from 'node:assert/strict'
import test from 'node:test'
import { featureDefinition, featureValue } from '../src/domain/catalogFeatureValues.mjs'
import research from '../src/domain/equipmentResearch.json' with { type: 'json' }
import { requestLines, requestNeedsChoice } from '../src/domain/pickerRequest.mjs'
import { validateRequest } from '../src/domain/siteRequest.mjs'
import {
  emptyFilter,
  featureOptions,
  fromSearch,
  matches,
  sectionStep,
} from '../src/lib/catalogFilter.ts'
import { catalogAvailable } from '../src/lib/equipmentResearch.ts'

test('Снятые модели и черновики скрыты; без цены и с непроверенным статусом остаются', () => {
  const available = research.products.filter((entry) =>
    catalogAvailable({ status: 'published', researchData: { category: 'plotters', ...entry } }),
  )
  assert.equal(available.length, 49)
  assert.ok(available.every((entry) => entry.status !== 'discontinued'))
  assert.equal(catalogAvailable({ status: 'draft' }), false)
  assert.equal(catalogAvailable({ status: 'published' }), true)
  assert.equal(
    catalogAvailable({
      status: 'published',
      researchData: { category: 'software', status: 'unknown' },
    }),
    true,
  )
})

test('Запрос цены и КП без комплектаций открыт; семейство и реальный подбор требуют выбора', () => {
  for (const kind of ['price', 'quote']) {
    assert.equal(requestNeedsChoice(kind, false, false), false)
    assert.equal(requestNeedsChoice(kind, true, false), true)
    assert.equal(requestNeedsChoice(kind, false, true), true)
    const lines = requestLines([], 75, 'plotWAVE T75', false, false)
    assert.deepEqual(lines, [{ productId: 75, offerId: null, label: 'plotWAVE T75', detail: null }])
    const result = validateRequest({
      name: 'Анна',
      phone: '+7 701 123 45 67',
      consent: true,
      idempotencyKey: '0b6c4c1e-1a2b-4c3d-8e9f-0123456789ab',
      kind,
      pageProductId: 75,
      quantity: 2,
      items: lines,
    })
    assert.equal(result.ok, true)
  }
  assert.deepEqual(requestLines([], 75, 'Семейство', false, true), [])
  assert.equal(requestNeedsChoice('help', true, true), false)
})

test('Выбранные предложения не заменяются заявкой без комплектации', () => {
  const lines = [{ productId: 1, offerId: '42', label: 'Комплект', detail: null }]
  assert.equal(requestLines(lines, 75, 'Плоттер', false, false), lines)
})

test('Рулоны: три понятных максимума вместо шести смешанных формулировок', () => {
  const raw = ['2', '1+1 опция', 'до 6', 'до 4', '4 или 6', '4']
  const definition = featureDefinition('plotters', {
    key: 'rolls',
    label: 'Количество рулонов',
    type: 'one',
    values: raw,
  })
  assert.deepEqual(definition.values, ['2', '4', '6'])
  const state = { ...emptyFilter, type: 'plotters' }
  const items = raw.map((value, id) => ({
    id,
    group: 'hardware',
    scope: 'all',
    types: ['plotters'],
    tasks: [],
    directions: [],
    research: { category: 'plotters', filters: { rolls: [value] } },
  }))
  const options = featureOptions(items, state).find((entry) => entry.key === 'plotters.rolls')
  assert.deepEqual(
    options.options.map(({ label }) => label),
    ['2 рулона', '4 рулона', '6 рулонов'],
  )
  const selected = { ...state, features: { 'plotters.rolls': ['6'] } }
  assert.deepEqual(
    items.filter((item) => matches(item, selected)).map((item) => raw[item.id]),
    ['до 6', '4 или 6'],
  )
  assert.deepEqual(
    fromSearch('?type=plotters&spec.plotters.rolls=4+%D0%B8%D0%BB%D0%B8+6').features,
    { 'plotters.rolls': ['6'] },
  )
})

test('Технические значения упорядочены численно; одинаковое разрешение не дублируется', () => {
  assert.deepEqual(
    featureDefinition('wide-scanners', {
      key: 'width',
      label: '',
      type: 'one',
      values: ['60"', '12"', '36"'],
    }).values,
    ['12"', '36"', '60"'],
  )
  assert.equal(featureValue('wide-scanners', 'resolution', '1200 x 600 dpi'), '1200 × 600 dpi')
  assert.deepEqual(
    featureDefinition('scanners', {
      key: 'accuracy',
      label: '',
      type: 'one',
      values: ['0,1 мм', '0,005 мм', '1,9 мм на 10 м'],
    }).values,
    ['0,005 мм', '0,1 мм', '1,9 мм на 10 м'],
  )
})

test('Родитель плоттеров не берёт картридж даже с более высоким приоритетом', () => {
  const photo = (url) => ({ url, width: 100, height: 100, alt: '', fit: 'photo' })
  const item = (id, type, rank, picture) => ({
    id,
    title: type,
    group: 'hardware',
    types: ['wide-format', type],
    directions: [],
    tasks: [],
    scope: 'all',
    rank,
    main: 'wide-format',
    picture,
  })
  const items = [
    item(1, 'consumables', 100, photo('/toner.png')),
    item(2, 'plotters', 0, photo('/plotter.png')),
    item(3, 'scanners', 0, photo('/scanner.png')),
  ]
  items[2].types = ['scanners']
  const facets = ['wide-format', 'scanners'].map((slug) => ({
    slug,
    title: slug,
    group: 'hardware',
    isDirection: false,
  }))
  const state = { ...emptyFilter, group: 'hardware' }
  assert.equal(
    sectionStep(items, facets, state).tiles.find((tile) => tile.slug === 'wide-format').picture.url,
    '/plotter.png',
  )
  items[1].picture = null
  assert.equal(
    sectionStep(items, facets, state).tiles.find((tile) => tile.slug === 'wide-format').picture,
    null,
  )
})
