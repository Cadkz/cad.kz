import assert from 'node:assert/strict'
import test from 'node:test'
import { validateContact, validateRequest } from '../src/domain/siteRequest.mjs'

const contact = { name: 'Анна', phone: '+7 701 123 45 67', consent: true }
const key = '0b6c4c1e-1a2b-4c3d-8e9f-0123456789ab'

test('заявка с главной: задача обязательна, товар не нужен', () => {
  const ok = validateRequest({
    ...contact,
    idempotencyKey: key,
    kind: 'help',
    source: 'home',
    comment: 'Нужен расчёт металлического каркаса',
    direction: 'structural',
    items: [],
  })
  assert.equal(ok.ok, true)
  if (!ok.ok) return
  assert.equal(ok.value.source, 'home')
  assert.equal(ok.value.pageProductId, null)
  assert.equal(ok.value.direction, 'structural')
  assert.equal(ok.value.familySlug, null)

  const noTask = validateRequest({
    ...contact,
    idempotencyKey: key,
    kind: 'help',
    source: 'home',
    items: [],
  })
  assert.equal(noTask.ok, false)
  if (!noTask.ok) assert.ok(noTask.errors.comment)
})

test('заявка с главной: только помощь с выбором и без позиций', () => {
  const base = { ...contact, idempotencyKey: key, source: 'home', comment: 'Нужен плоттер А0' }
  assert.equal(validateRequest({ ...base, kind: 'quote', items: [] }).ok, false)
  assert.equal(validateRequest({ ...base, kind: 'help', items: [{ productId: 5 }] }).ok, false)
  const bad = validateRequest({ ...base, kind: 'help', items: [], direction: '<script>' })
  assert.equal(bad.ok, true)
  if (bad.ok) assert.equal(bad.value.direction, null)
})

test('заявка со страницы товара — как раньше: товар обязателен, комментарий нет', () => {
  const base = { ...contact, idempotencyKey: key, kind: 'price', items: [] }
  assert.equal(validateRequest(base).ok, false)
  const ok = validateRequest({ ...base, pageProductId: 7 })
  assert.equal(ok.ok, true)
  if (ok.ok) {
    assert.equal(ok.value.source, 'product')
    assert.equal(ok.value.direction, null)
  }
})

test('проверка формы в браузере: задача нужна только с главной', () => {
  assert.equal(validateContact(contact).ok, true)
  assert.equal(validateContact(contact, { taskRequired: true }).ok, false)
  assert.equal(
    validateContact({ ...contact, comment: 'Revit на 5 мест' }, { taskRequired: true }).ok,
    true,
  )
})
