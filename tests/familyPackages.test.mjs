import assert from 'node:assert/strict'
import test from 'node:test'
import { familyIncludes, uniqueLabels } from '../src/domain/familyPackages.mjs'
import { includedBy, pickedLines, toggleMany } from '../src/domain/picker.mjs'

const members = [
  { key: 'base', title: 'ПАССАТ - базовый' },
  { key: 'col', title: 'ПАССАТ - Колонны' },
  { key: 'heat', title: 'ПАССАТ - Теплообменники' },
  { key: 'sh', title: 'Штуцер-МКЭ' },
  { key: 'pack', title: 'ПАССАТ модули: ПАССАТ-Базовый, ПАССАТ-Колонны, ПАССАТ-Теплообменники' },
  {
    key: 'big',
    title: 'ПАССАТ модули: ПАССАТ-Базовый, ПАССАТ-Колонны, ПАССАТ-Теплообменники + Штуцер-МКЭ',
  },
]

test('пакет — товар, в названии которого две и больше программы семейства', () => {
  const inc = familyIncludes(members)
  assert.deepEqual(inc.get('pack'), ['base', 'col', 'heat'])
  assert.deepEqual(inc.get('big'), ['base', 'col', 'heat', 'sh', 'pack'])
  assert.equal(inc.has('base'), false)
})

test('одинаковые короткие подписи заменяются полным названием', () => {
  const out = uniqueLabels([
    { label: 'ПАССАТ', note: 'Базовый', title: 'ПАССАТ - базовый' },
    { label: 'ПАССАТ', note: 'Колонны', title: 'ПАССАТ - колонны' },
    { label: 'АРБАТ', note: 'Экспертиза', title: 'АРБАТ - экспертиза' },
  ])
  assert.deepEqual(out, [
    { label: 'ПАССАТ - базовый', note: null },
    { label: 'ПАССАТ - колонны', note: null },
    { label: 'АРБАТ', note: 'Экспертиза' },
  ])
})

test('пакет снимает входящие программы и не даёт посчитать их дважды', () => {
  const inc = familyIncludes(members)
  const items = members.map((m) => ({
    key: m.key,
    productId: 1,
    label: m.title,
    note: null,
    offers: [],
    fixedOffers: [],
    preselect: false,
    includes: inc.get(m.key) ?? [],
  }))
  const view = {
    switches: [],
    steps: [{ key: 's', title: 'Программы', hint: null, mode: 'many', collapsed: false, items }],
  }
  let state = { switches: {}, one: {}, many: ['base', 'sh'], bundle: null }
  state = toggleMany(view, state, 'pack')
  assert.deepEqual(state.many, ['sh', 'pack'])
  assert.equal(includedBy(view, state, 'base')?.key, 'pack')
  // Даже если галочка осталась (старое состояние), в итог программа отдельно не идёт.
  const lines = pickedLines(view, { ...state, many: ['base', 'pack'] })
  assert.deepEqual(
    lines.map((l) => l.item.key),
    ['pack'],
  )
})
