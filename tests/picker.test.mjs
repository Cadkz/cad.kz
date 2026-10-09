import assert from 'node:assert/strict'
import test from 'node:test'
import {
  initialState,
  itemUnavailable,
  lineLabel,
  offerFor,
  offersAsPicker,
  pickedLines,
  setSwitch,
} from '../src/domain/picker.mjs'

const offer = (id, variants, configuration = id) => ({ id, configuration, variants, price: '1 ₸' })
const item = (key, productId, offers, extra = {}) => ({
  key,
  productId,
  label: key,
  note: null,
  offers,
  fixedOffer: null,
  preselect: false,
  ...extra,
})
const edition = {
  key: 'ed',
  title: 'Редакция',
  options: [
    { value: 'S392', note: null },
    { value: 'SPro', note: null },
  ],
}

/** Подбор SCAD Office как на сайте: основа, задачи галочками, доп. функции, комплекты. */
const scad = {
  switches: [edition],
  steps: [
    {
      key: 'base',
      title: 'Основа',
      hint: null,
      mode: 'base',
      collapsed: false,
      items: [item('ssb', 590, [offer('750', ['S392']), offer('755', ['SPRO'])])],
    },
    {
      key: 'tasks',
      title: 'Что проверять',
      hint: null,
      mode: 'many',
      collapsed: false,
      items: [
        item('rc', 588, [offer('751', ['S392']), offer('756', ['S Pro'])], { preselect: true }),
        item('ss', 589, [offer('752', ['S392']), offer('757', ['SPro'])]),
      ],
    },
    {
      key: 'extra',
      title: 'Доп. функции',
      hint: null,
      mode: 'many',
      collapsed: true,
      items: [item('nl', 319, [offer('984', [])])],
    },
    {
      key: 'bundles',
      title: 'Комплекты',
      hint: null,
      mode: 'bundle',
      collapsed: false,
      items: [
        item('full', 593, [offer('826', ['SPro']), offer('825', ['SPro'])], {
          fixedOffer: '826',
        }),
      ],
    },
  ],
}

test('предложение выбирается по переключателю, регистр и пробелы не важны', () => {
  const ssb = scad.steps[0].items[0]
  assert.equal(offerFor(ssb, scad.switches, { ed: 'S392' })?.id, '750')
  assert.equal(offerFor(ssb, scad.switches, { ed: 'SPro' })?.id, '755')
  const rc = scad.steps[1].items[0]
  assert.equal(offerFor(rc, scad.switches, { ed: 'SPro' })?.id, '756')
})

test('предложение без значений подходит при любом выборе', () => {
  const nl = scad.steps[2].items[0]
  assert.equal(offerFor(nl, scad.switches, { ed: 'S392' })?.id, '984')
})

test('конкретное предложение комплекта: есть только в SPro', () => {
  const full = scad.steps[3].items[0]
  assert.equal(offerFor(full, scad.switches, { ed: 'SPro' })?.id, '826')
  assert.equal(itemUnavailable(full, scad.switches, { ed: 'S392' }), true)
})

test('начальный выбор: основа и отмеченные галочки, первая редакция', () => {
  const state = initialState(scad)
  assert.deepEqual(state.switches, { ed: 'S392' })
  assert.deepEqual(
    pickedLines(scad, state).map((l) => l.offer?.id),
    ['750', '751'],
  )
})

test('адрес ?pick=ID отмечает вариант: старый адрес пакета ведёт на подбор с этим пакетом', () => {
  const state = initialState(scad, 589)
  assert.deepEqual(state.many.sort(), ['rc', 'ss'])
  const bundle = initialState(scad, 593)
  assert.equal(bundle.bundle, 'full')
})

test('смена редакции меняет предложения и снимает недоступный комплект', () => {
  let state = initialState(scad)
  state = setSwitch(scad, state, 'ed', 'SPro')
  state = { ...state, bundle: 'full' }
  assert.deepEqual(
    pickedLines(scad, state).map((l) => l.offer?.id),
    ['826'],
  )
  state = setSwitch(scad, state, 'ed', 'S392')
  assert.equal(state.bundle, null)
  assert.deepEqual(
    pickedLines(scad, state).map((l) => l.offer?.id),
    ['750', '751'],
  )
})

test('вариант без предложений — по запросу, а не недоступен', () => {
  const view = {
    switches: [],
    steps: [
      {
        key: 'v',
        title: 'Версия',
        hint: null,
        mode: 'one',
        collapsed: false,
        items: [item('acad', 82, []), item('lt', 83, [])],
      },
    ],
  }
  const state = initialState(view)
  assert.equal(state.one.v, 'acad')
  const [line] = pickedLines(view, state)
  assert.equal(line.offer, null)
  assert.equal(itemUnavailable(line.item, [], {}), false)
})

test('обычная страница: предложения товара одним шагом', () => {
  const view = offersAsPicker(7, [offer('1', [], 'Базовая'), offer('2', [], 'Сетевая')], {
    1: '—',
    2: 'на 1 год',
  })
  assert.equal(view.steps[0].mode, 'one')
  assert.equal(view.steps[0].items[1].note, 'на 1 год')
  assert.equal(view.steps[0].items[0].note, null)
  assert.deepEqual(offersAsPicker(7, [], {}), { switches: [], steps: [] })
  const lines = pickedLines(view, initialState(view))
  assert.equal(lineLabel(lines[0]), 'Базовая')
})
