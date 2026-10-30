import assert from 'node:assert/strict'
import test from 'node:test'
import { monthLabel } from '../src/domain/trainingFilter.mjs'
import {
  emptyFilter,
  facetOptions,
  fromParams,
  groupedResults,
  results,
  toQuery,
  update,
} from '../src/lib/catalogFilter.ts'

const course = (id, title, topic, starts) => ({
  id,
  title,
  group: 'service',
  directions: [],
  types: ['training'],
  vendor: 'CAD.kz',
  tasks: [],
  topic,
  ...(starts ? { starts } : {}),
})
const items = [
  course(1, 'Revit', 'bim', ['2026-11-05', '2027-01-11']),
  course(2, 'AutoCAD', 'bim', ['2026-12-01']),
  course(3, 'SCAD', 'structural', ['2026-12-08']),
  course(4, 'ЛИРА', 'structural'),
]
const training = update(emptyFilter, { group: 'service', type: 'training' })

test('обучение: месяц старта, направление, набор — варианты по расписанию', () => {
  const options = facetOptions(items, [], training).training
  assert.ok(options)
  assert.deepEqual(
    options.months.map((m) => [m.label, m.count]),
    [
      ['Ноябрь', 1],
      ['Декабрь', 2],
      ['Январь 2027', 1],
    ],
  )
  assert.deepEqual(
    options.topics.map((t) => t.value),
    ['bim', 'structural'],
  )
  assert.equal(options.open, 3)
  const december = { ...training, training: { ...training.training, month: '2026-12' } }
  assert.deepEqual(
    results(items, december).items.map((i) => i.id),
    [2, 3],
  )
  const open = { ...training, training: { ...training.training, open: true, topic: 'structural' } }
  assert.deepEqual(
    results(items, open).items.map((i) => i.id),
    [3],
  )
  // У программ фильтров обучения нет.
  assert.equal(facetOptions(items, [], update(emptyFilter, { group: 'software' })).training, null)
})

test('обучение: «Ближайший старт» — одним списком по дате, без групп', () => {
  const state = { ...training, training: { ...training.training, sort: 'start' } }
  assert.equal(groupedResults(items, state, []), null)
  assert.deepEqual(
    results(items, state).items.map((i) => i.id),
    [1, 2, 3, 4],
  )
  const december = { ...state, training: { ...state.training, month: '2026-12' } }
  assert.deepEqual(
    results(items, december).items.map((i) => i.id),
    [2, 3],
  )
  // По направлениям — группами.
  assert.equal(groupedResults(items, training, [])?.length, 2)
})

test('обучение: выбор в адресе и сброс при смене раздела', () => {
  const state = fromParams({
    group: 'service',
    type: 'training',
    month: '2026-12',
    topic: 'bim',
    open: '1',
    sort: 'start',
  })
  assert.deepEqual(state.training, { topic: 'bim', month: '2026-12', open: true, sort: 'start' })
  assert.equal(
    toQuery(state),
    'group=service&type=training&topic=bim&month=2026-12&open=1&sort=start',
  )
  assert.deepEqual(update(state, { type: 'consulting' }).training.month, null)
  assert.equal(fromParams({ group: 'software', month: '2026-12' }).training.month, null)
  assert.equal(monthLabel('2027-01', '2026'), 'Январь 2027')
})
