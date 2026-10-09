import assert from 'node:assert/strict'
import test from 'node:test'
import { menuColumns } from '../src/domain/menu.mjs'
import { compareInSection, pickVaried, priorityRank } from '../src/domain/priority.mjs'
import { seedLevel } from '../src/domain/prioritySeed.mjs'

const item = (title, rank, vendor, main = 'geotech') => ({ title, rank, vendor, main })
const titles = (list) => list.map((x) => x.title)

test('уровень товара: свой, иначе производителя, иначе обычный', () => {
  assert.equal(priorityRank('flagship', 'low'), 3)
  assert.equal(priorityRank(null, 'top'), 2)
  assert.equal(priorityRank(undefined, undefined), 1)
  assert.equal(priorityRank('low', 'top'), 0)
})

test('топы выше обычных, внутри уровня — производители раздела по порядку', () => {
  const list = [
    item('Альфа', 1, 'Прочий'),
    item('ГРУНТ', 2, 'ЛИРА'),
    item('ЗАПРОС', 2, 'SCAD'),
    item('GEO5 Сваи', 2, 'Fine'),
    item('GEO5', 3, 'Fine'),
  ].sort(compareInSection('geotech', ['Fine', 'ЛИРА', 'SCAD']))
  assert.deepEqual(titles(list), ['GEO5', 'GEO5 Сваи', 'ГРУНТ', 'ЗАПРОС', 'Альфа'])
})

test('в своём основном разделе товар выше, чем гость из другого раздела', () => {
  const list = [item('А', 1, 'X', 'structural'), item('Б', 1, 'Y', 'geotech')].sort(
    compareInSection('geotech'),
  )
  assert.deepEqual(titles(list), ['Б', 'А'])
})

test('меню: после двух товаров производителя место получает другой того же уровня', () => {
  const sorted = [
    item('GEO5', 3, 'Fine'),
    item('GEO5 А', 2, 'Fine'),
    item('GEO5 Б', 2, 'Fine'),
    item('GEO5 В', 2, 'Fine'),
    item('ГРУНТ', 2, 'ЛИРА'),
    item('ЗАПРОС', 2, 'SCAD'),
    item('Обычный', 1, 'Прочий'),
  ]
  assert.deepEqual(titles(pickVaried(sorted, 5)), ['GEO5', 'GEO5 А', 'GEO5 Б', 'ГРУНТ', 'ЗАПРОС'])
})

test('меню: разнообразие не пускает обычный товар выше оставшихся топов', () => {
  const sorted = [
    item('SCAD Office', 3, 'SCAD'),
    item('ЛИРА', 3, 'ЛИРА'),
    item('Академик', 2, 'ЛИРА'),
    item('АРБАТ', 2, 'SCAD'),
    item('КРИСТАЛЛ', 2, 'SCAD'),
    item('Обычный', 1, 'Прочий'),
  ]
  assert.deepEqual(titles(pickVaried(sorted, 5)), [
    'SCAD Office',
    'ЛИРА',
    'Академик',
    'АРБАТ',
    'КРИСТАЛЛ',
  ])
})

test('колонка меню учитывает уровень и порядок производителей раздела', () => {
  const section = {
    id: 3,
    slug: 'geotech',
    title: 'Геотехника',
    menuGroup: 'software',
    isDirection: true,
    pins: [2, 1],
  }
  const product = (id, title, vendor, rank) => ({
    id,
    title,
    main: 3,
    sections: [3],
    href: `/${id}`,
    vendor,
    rank,
  })
  const [column] = menuColumns(
    [section],
    [product(1, 'Аа', 9, 1), product(2, 'ЗАПРОС', 1, 2), product(3, 'GEO5', 2, 2)],
    () => '/',
  )
  assert.deepEqual(
    column.links.map((link) => link.title),
    ['GEO5', 'ЗАПРОС', 'Аа'],
  )
})

test('первая настройка: флагманы, топы и ключи по названиям', () => {
  assert.equal(seedLevel({ title: 'GEO5', vendor: 'Fine Software' }), 'flagship')
  assert.equal(seedLevel({ title: 'GEO5 Сваи', vendor: 'Fine Software' }), 'top')
  assert.equal(seedLevel({ title: 'FIN EC', vendor: 'Fine Software' }), null)
  assert.equal(seedLevel({ title: 'Revit 2024', vendor: 'Autodesk' }), 'flagship')
  assert.equal(seedLevel({ title: 'AutoCAD Revit LT Suite', vendor: 'Autodesk' }), 'top')
  assert.equal(seedLevel({ title: '3ds Max', vendor: 'Autodesk' }), null)
  assert.equal(seedLevel({ title: 'ЛИРА - FEM (ЛИРА САПР)', vendor: 'ЛИРА-FEM' }), 'flagship')
  assert.equal(seedLevel({ title: 'Обновление для АВС ПИР', vendor: 'АВС' }), 'low')
})
