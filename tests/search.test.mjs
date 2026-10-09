import assert from 'node:assert/strict'
import test from 'node:test'
import { normalize, searchItems, swapLayout, translit } from '../src/domain/search.mjs'

const items = [
  { title: 'AutoCAD', vendor: 'Autodesk', summary: 'САПР для 2D-черчения и 3D-моделирования' },
  { title: 'Revit', vendor: 'Autodesk', summary: 'BIM-платформа для архитектуры' },
  { title: 'ЛИРА-FEM', vendor: 'ЛИРА софт', summary: 'Расчёт конструкций' },
  {
    title: 'SCAD Office',
    vendor: 'SCAD Soft',
    summary: 'Расчёт конструкций методом конечных элементов',
  },
  { title: 'Artec Leo', vendor: 'Artec 3D', summary: 'Беспроводной 3D-сканер' },
  { title: 'AutoCAD LT', vendor: 'Autodesk', summary: 'Только 2D-черчение' },
]
const titles = (query) => searchItems(items, query).map((item) => item.title)

test('нормализация: регистр, ё, знаки', () => {
  assert.equal(normalize('ЛИРА-FEM, Расчёт!'), 'лира fem расчет')
  assert.equal(translit('ревит'), 'revit')
  assert.equal(swapLayout('фгещсфв'), 'autocad')
})

test('находит по названию, производителю и анонсу', () => {
  assert.deepEqual(titles('revit'), ['Revit'])
  assert.deepEqual(titles('Autodesk').sort(), ['AutoCAD', 'AutoCAD LT', 'Revit'])
  assert.deepEqual(titles('сканер'), ['Artec Leo'])
  assert.deepEqual(titles('расчет конструкций').sort(), ['SCAD Office', 'ЛИРА-FEM'])
})

test('кириллица, на слух, опечатки и раскладка', () => {
  assert.equal(titles('ревит')[0], 'Revit')
  for (const query of ['автокад', 'Автокад', 'овтокад', 'автокат', 'фгещсфв', 'autocda'])
    assert.equal(titles(query)[0], 'AutoCAD', query)
  assert.equal(titles('лира')[0], 'ЛИРА-FEM')
  assert.equal(titles('скад')[0], 'SCAD Office')
})

test('начало слова и точное название выше', () => {
  assert.deepEqual(titles('скан'), ['Artec Leo'])
  assert.deepEqual(titles('autocad lt'), ['AutoCAD LT'])
})

test('пустой и бессмысленный запрос', () => {
  assert.deepEqual(titles('   '), [])
  assert.deepEqual(titles('пылесос'), [])
  assert.deepEqual(titles('zz'), [])
})
