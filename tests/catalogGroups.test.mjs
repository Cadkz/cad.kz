import assert from 'node:assert/strict'
import test from 'node:test'
import { geoModuleTasks, geoPackageTasks } from '../src/domain/geoTasks.mjs'
import {
  autoVendor,
  emptyFilter,
  facetOptions,
  groupedResults,
  results,
  update,
} from '../src/lib/catalogFilter.ts'

// Замечание владельца 12.10.2026: лишние шаги, сателлиты одной карточкой, GEO5 без пакетов.
const card = (id, fields) => ({
  id,
  title: `T${id}`,
  group: 'software',
  directions: ['calc'],
  types: [],
  vendor: 'SCAD Soft',
  tasks: [],
  rank: 0,
  line: null,
  lineOrder: null,
  scope: 'all',
  ...fields,
})
const items = [
  card(1, { title: 'SCAD Office', line: '10', lineOrder: 1 }),
  card(-20, { title: 'Программы-сателлиты', line: '20', scope: 'family' }),
  card(21, { title: 'Кристалл', line: '20', scope: 'detail' }),
  card(22, { title: 'Арбат', line: '20', scope: 'detail' }),
  card(3, { title: 'ЛИРА-САПР', vendor: 'ЛИРА софт' }),
  card(4, { title: 'GEO5', directions: ['geo'], vendor: 'Fine', tasks: ['Сваи', 'Откосы'] }),
  card(5, {
    title: 'GEO5 Основания',
    directions: ['geo'],
    vendor: 'Fine',
    tasks: ['Сваи'],
    scope: 'detail',
  }),
  card(6, {
    title: 'GEO5 Свая',
    directions: ['geo'],
    vendor: 'Fine',
    tasks: ['Сваи'],
    scope: 'task',
  }),
]
const facets = [
  { slug: 'calc', title: 'Расчёт', group: 'software', isDirection: true },
  { slug: 'geo', title: 'Геотехника', group: 'software', isDirection: true },
]
const lines = [
  { id: '10', title: 'Программный комплекс', vendor: 'SCAD Soft', order: 1, familyHref: null },
  {
    id: '20',
    title: 'Программы-сателлиты',
    vendor: 'SCAD Soft',
    order: 2,
    familyHref: '/families/scad-satellites',
  },
]
const titles = (list) => list.map((item) => item.title)

test('в общем списке семейство одной карточкой, программ семейства нет', () => {
  const state = update(emptyFilter, { direction: 'calc' })
  assert.deepEqual(titles(results(items, state).items).sort(), [
    'SCAD Office',
    'ЛИРА-САПР',
    'Программы-сателлиты',
  ])
  assert.equal(groupedResults(items, state, lines), null)
})

test('выбран производитель: группы по линейкам, сателлиты списком со ссылкой на семейство', () => {
  const state = update(emptyFilter, { direction: 'calc', vendors: ['SCAD Soft'] })
  const groups = groupedResults(items, state, lines)
  assert.deepEqual(
    groups.map((g) => [g.title, titles(g.items)]),
    [
      ['Программный комплекс', ['SCAD Office']],
      ['Программы-сателлиты', ['Арбат', 'Кристалл']],
    ],
  )
  assert.equal(groups[1].href, '/families/scad-satellites')
})

test('один производитель в разделе подставляется сам, пакеты видны, задачи сужают', () => {
  const state = update(emptyFilter, { direction: 'geo' })
  const view = autoVendor(items, state)
  assert.deepEqual(view.vendors, ['Fine'])
  assert.deepEqual(state.vendors, [])
  const [group] = groupedResults(items, view, lines)
  assert.equal(group.title, '')
  assert.deepEqual(titles(group.items), ['GEO5', 'GEO5 Основания'])
  assert.deepEqual(
    facetOptions(items, facets, view).tasks.map((t) => [t.value, t.count]),
    [
      ['Откосы', 1],
      ['Сваи', 3],
    ],
  )
  const piles = update(view, { tasks: ['Сваи'] })
  assert.deepEqual(titles(results(items, piles).items).sort(), [
    'GEO5',
    'GEO5 Основания',
    'GEO5 Свая',
  ])
})

test('задачи, которые ничего не сужают, не показываются', () => {
  const only = [card(1, { tasks: ['А'] }), card(2, { tasks: ['А'] })]
  const state = update(emptyFilter, { direction: 'calc' })
  assert.deepEqual(facetOptions(only, facets, state).tasks, [])
})

test('задачи GEO5 по названиям программ и пакетов', () => {
  assert.deepEqual(geoModuleTasks('GEO5 Свайный фундамент'), ['Свайные фундаменты'])
  assert.deepEqual(geoModuleTasks('GEO5 Плита'), ['Фундаменты мелкого заложения'])
  assert.deepEqual(geoModuleTasks('GEO5 Откос'), ['Расчёт устойчивости'])
  assert.deepEqual(geoModuleTasks('GEO5 Шпунтовое ограждение'), ['Ограждающие конструкции'])
  assert.deepEqual(geoModuleTasks('GEO5 МКЭ - Тоннель'), [
    'Расчёт устойчивости',
    'Расчёт осадки',
    'Тоннели и шахты',
  ])
  assert.deepEqual(geoModuleTasks('GEO5 Стратиграфия'), ['Геологическое моделирование'])
  assert.deepEqual(geoPackageTasks('Основания зданий и сооружений'), [
    'Фундаменты мелкого заложения',
    'Свайные фундаменты',
    'Расчёт осадки',
  ])
  assert.equal(geoPackageTasks('GEO5 Профессионал').length, 9)
})
