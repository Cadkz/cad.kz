import assert from 'node:assert/strict'
import test from 'node:test'
import { menuColumns } from '../src/domain/menu.mjs'
import { compareInSection, pickVaried, priorityRank } from '../src/domain/priority.mjs'
import { scadBeforeLira, seedLevel, seedTopPlace } from '../src/domain/prioritySeed.mjs'

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

test('меню: производители раздела по «Первыми в разделе», потом по уровню', () => {
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
    [],
    new Map([
      [1, 'SCAD Soft'],
      [2, 'Fine Software'],
      [9, 'Другой'],
    ]),
    () => '/',
  )
  assert.deepEqual(
    column.vendors.map((vendor) => vendor.title),
    ['Fine Software', 'SCAD Soft', 'Другой'],
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

test('топы продаж по местам выше флагманов: ЛИРА после CSoft, Inventor после топов', () => {
  const ranked = (title, own, vendor, place) => ({
    title,
    rank: priorityRank(own, 'top', place),
    vendor,
    main: null,
  })
  const list = [
    ranked('ЛИРА - FEM', 'flagship', 'ЛИРА', 8),
    ranked('Inventor Professional', 'flagship', 'Autodesk'),
    ranked('СПДС', null, 'CSoft', 7),
    ranked('Artec Leo', 'flagship', 'Artec', 6),
    ranked('Artec Eva', 'flagship', 'Artec', 6),
    ranked('GEO5', 'flagship', 'Fine', 5),
    ranked('SCAD Office', 'flagship', 'SCAD', 4),
    ranked('Revit', 'flagship', 'Autodesk', 3),
    ranked('Программный комплекс АВС', 'flagship', 'АВС', 2),
    ranked('AutoCAD', 'flagship', 'Autodesk', 1),
  ].sort(compareInSection())
  assert.deepEqual(titles(list), [
    'AutoCAD',
    'Программный комплекс АВС',
    'Revit',
    'SCAD Office',
    'GEO5',
    'Artec Eva',
    'Artec Leo',
    'СПДС',
    'ЛИРА - FEM',
    'Inventor Professional',
  ])
})

test('в разделе топы продаж — по порядку производителей раздела, потом по местам', () => {
  const ranked = (title, vendor, place) => ({
    title,
    rank: priorityRank('flagship', null, place),
    vendor,
    main: 'geotech',
  })
  const list = [
    ranked('ЛИРА - FEM', 'ЛИРА', 8),
    ranked('SCAD Office', 'SCAD', 4),
    ranked('GEO5', 'Fine', 5),
    item('GEO5 Сваи', 2, 'Fine'),
  ].sort(compareInSection('geotech', ['Fine', 'SCAD', 'ЛИРА']))
  assert.deepEqual(titles(list), ['GEO5', 'SCAD Office', 'ЛИРА - FEM', 'GEO5 Сваи'])
})

test('SCAD Soft перед ЛИРА-FEM в порядке раздела', () => {
  assert.deepEqual(scadBeforeLira(['Fine', 'ЛИРА', 'SCAD', 'Base'], 'SCAD', 'ЛИРА'), [
    'Fine',
    'SCAD',
    'ЛИРА',
    'Base',
  ])
  assert.deepEqual(scadBeforeLira(['Autodesk', 'CSoft', 'ЛИРА'], 'SCAD', 'ЛИРА'), [
    'Autodesk',
    'CSoft',
    'SCAD',
    'ЛИРА',
  ])
  assert.deepEqual(scadBeforeLira(['SCAD', 'ЛИРА'], 'SCAD', 'ЛИРА'), ['SCAD', 'ЛИРА'])
  assert.deepEqual(scadBeforeLira(['Autodesk'], 'SCAD', 'ЛИРА'), ['Autodesk'])
})

test('места в топе по правилам владельца', () => {
  assert.equal(seedTopPlace({ title: 'AutoCAD', vendor: 'Autodesk' }), 1)
  assert.equal(seedTopPlace({ title: 'AutoCAD LT', vendor: 'Autodesk' }), null)
  assert.equal(seedTopPlace({ title: 'SCAD Office v. 25.1', vendor: 'SCAD Soft' }), 4)
  assert.equal(seedTopPlace({ title: 'ЛИРА - FEM (ЛИРА САПР)', vendor: 'ЛИРА-FEM' }), 8)
  assert.equal(seedTopPlace({ title: 'Inventor Professional', vendor: 'Autodesk' }), null)
  assert.equal(seedTopPlace({ title: 'СПДС', vendor: 'Csoft Development' }), 7)
  assert.equal(seedTopPlace({ title: 'СПДСx', vendor: 'Csoft Development' }), null)
})
