import assert from 'node:assert/strict'
import test from 'node:test'
import { plainTitle, withTitleAlias } from '../src/domain/productTitle.mjs'

test('название без скобок: одно имя в карточке и на странице товара', () => {
  assert.equal(plainTitle('LIRA-FEM (Лира-Сапр)'), 'LIRA-FEM')
  assert.equal(plainTitle('Программный комплекс АВС-KZ (АВС-4)'), 'Программный комплекс АВС-KZ')
  assert.equal(plainTitle('SCAD (Office) v. 25.1'), 'SCAD v. 25.1')
  assert.equal(plainTitle('Сметы (АВС (KZ))'), 'Сметы')
  assert.equal(plainTitle('ПАССАТ (сосуды), модуль'), 'ПАССАТ, модуль')
  assert.equal(plainTitle('AutoCAD'), 'AutoCAD')
})

test('название только из скобок или с непарной скобкой не трогаем', () => {
  assert.equal(plainTitle('(Лира-Сапр)'), '(Лира-Сапр)')
  assert.equal(plainTitle('Revit (2026'), 'Revit (2026')
})

test('полное название остаётся в поиске', () => {
  assert.equal(withTitleAlias('лира', 'LIRA-FEM (Лира-Сапр)'), 'лира, LIRA-FEM (Лира-Сапр)')
  assert.equal(withTitleAlias(null, 'LIRA-FEM (Лира-Сапр)'), 'LIRA-FEM (Лира-Сапр)')
  assert.equal(withTitleAlias('автокад', 'AutoCAD'), 'автокад')
  assert.equal(withTitleAlias(undefined, 'AutoCAD'), null)
})
