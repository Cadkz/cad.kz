import assert from 'node:assert/strict'
import test from 'node:test'
import { CARD_TEXTS } from '../src/domain/cardTexts.mjs'
import {
  AUTODESK_LINES,
  autodeskLineOf,
  DATA_MANAGEMENT_SLUG,
  FORMA_PRODUCTS,
} from '../src/domain/formaCatalogSeed.mjs'

const product = (slug, extra = {}) => ({
  slug,
  kind: 'software',
  status: 'published',
  line: null,
  ...extra,
})

test('Forma: три продукта из AEC Collection, Docs переименован по старому адресу', () => {
  assert.deepEqual(
    FORMA_PRODUCTS.map((p) => p.title),
    ['Forma Site Design', 'Forma Building Design', 'Forma Data Management'],
  )
  const docs = FORMA_PRODUCTS.find((p) => p.slug === DATA_MANAGEMENT_SLUG)
  assert.equal(docs?.isNew, false)
  assert.match(docs?.aliases ?? '', /autodesk docs/)
  for (const p of FORMA_PRODUCTS) {
    assert.ok(CARD_TEXTS[p.slug], `нет текста карточки у ${p.slug}`)
    assert.ok(CARD_TEXTS[p.slug].length <= 70, `длинный текст карточки у ${p.slug}`)
  }
})

test('Линейки Autodesk: программы, коллекции, Forma', () => {
  assert.equal(autodeskLineOf(product('autocad')), 'programs')
  assert.equal(autodeskLineOf(product('product_design_manufacturing_collection')), 'collections')
  assert.equal(autodeskLineOf(product('forma_site_design')), 'forma')
  // Forma — в свою линейку, даже если была другая или товар ещё черновик.
  assert.equal(autodeskLineOf(product(DATA_MANAGEMENT_SLUG, { line: 5, status: 'draft' })), 'forma')
  // Своя линейка из админки, скрытые программы и курсы не трогаем.
  assert.equal(autodeskLineOf(product('autocad', { line: 7 })), null)
  assert.equal(autodeskLineOf(product('maya', { status: 'draft' })), null)
  assert.equal(autodeskLineOf(product('kurs_revit', { kind: 'course' })), null)
  const orders = Object.values(AUTODESK_LINES).map((line) => line.order)
  assert.deepEqual(
    orders,
    [...orders].sort((a, b) => a - b),
  )
})
