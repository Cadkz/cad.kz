import assert from 'node:assert/strict'
import { test } from 'node:test'
import { listHref } from '../src/domain/adminLinks.mjs'
import { PRESETS, presetColumns, presetWhere } from '../src/domain/presetSeed.mjs'
import { CHECKS, productQuality, qualityLevel, qualityText } from '../src/domain/quality.mjs'

const full = {
  offers: 2,
  priced: 2,
  hasImage: true,
  hasDescription: true,
  hasSummary: true,
  hasSection: true,
  needsPrice: true,
}

test('заполненность: всё есть — 100 %', () => {
  assert.deepEqual(productQuality(full), { gaps: [], score: 100 })
})

test('заполненность: недостатки по порядку важности и процент', () => {
  assert.deepEqual(productQuality({ ...full, hasImage: false }), { gaps: ['image'], score: 83 })
  assert.deepEqual(productQuality({ ...full, hasSection: false, hasDescription: false }), {
    gaps: ['description', 'section'],
    score: 66,
  })
})

test('заполненность: без предложений нет и цены — две непройденные проверки', () => {
  assert.deepEqual(productQuality({ ...full, offers: 0, priced: 0 }), {
    gaps: ['offers'],
    score: 66,
  })
})

test('заполненность: где цену не показывают, проверок пять', () => {
  const hardware = { ...full, needsPrice: false, priced: 0 }
  assert.deepEqual(productQuality(hardware), { gaps: [], score: 100 })
  assert.deepEqual(productQuality({ ...hardware, offers: 0 }), { gaps: ['offers'], score: 80 })
  const empty = {
    ...hardware,
    offers: 0,
    hasImage: false,
    hasDescription: false,
    hasSummary: false,
    hasSection: false,
  }
  assert.equal(productQuality(empty).score, 0)
  assert.equal(productQuality({ ...empty, needsPrice: true }).score, 0)
})

test('строка в списке и цвет отметки', () => {
  assert.equal(qualityText([]), 'Всё заполнено')
  assert.equal(qualityText(['image']), 'Нет картинки')
  assert.equal(qualityText(['image', 'description']), 'Нет картинки, описания')
  assert.equal(qualityText(['unknown']), 'Всё заполнено')
  assert.equal(qualityLevel(100), 'full')
  assert.equal(qualityLevel(66), 'part')
  assert.equal(qualityLevel(33), 'low')
  assert.equal(qualityLevel(null), 'none')
})

test('ссылка на список с фильтром — в записи Payload', () => {
  assert.equal(listHref('products', []), '/admin/collections/products')
  assert.equal(
    listHref('products', [{ status: { equals: 'published' } }, { qualityGaps: { in: ['image'] } }]),
    '/admin/collections/products?where[or][0][and][0][status][equals]=published' +
      '&where[or][0][and][1][qualityGaps][in][0]=image',
  )
  assert.equal(
    listHref('publications', [{ title: { like: 'GEO5 & Revit' } }]),
    '/admin/collections/publications?where[or][0][and][0][title][like]=GEO5%20%26%20Revit',
  )
})

test('готовые виды: названия не повторяются внутри списка, поля заполненности существуют', () => {
  const keys = PRESETS.map((preset) => `${preset.collection}:${preset.title}`)
  assert.equal(new Set(keys).size, keys.length)
  for (const preset of PRESETS) {
    assert.ok(preset.columns.includes('title'), preset.title)
    assert.ok(preset.where.length > 0, preset.title)
    for (const condition of preset.where) {
      const gaps = /** @type {{ qualityGaps?: { in: string[] } }} */ (condition).qualityGaps
      for (const gap of gaps?.in ?? []) assert.ok(CHECKS.includes(gap), `${preset.title}: ${gap}`)
    }
  }
  assert.deepEqual(presetWhere([{ a: 1 }]), { or: [{ and: [{ a: 1 }] }] })
  assert.deepEqual(presetColumns(['title']), [{ accessor: 'title', active: true }])
})
