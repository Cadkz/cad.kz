import assert from 'node:assert/strict'
import test from 'node:test'
import { directionSections, isRetired } from '../src/domain/directionRules.mjs'

const sw = (vendor, title, kind = 'software') => directionSections({ vendor, title, kind })

test('товар без исключения получает разделы группы', () => {
  assert.deepEqual(sw('Artec 3D', 'Artec Leo', 'hardware'), ['scanners', 'machine'])
  assert.deepEqual(sw('Image Access', 'WideTEK 36CL', 'hardware'), ['wide-scanners'])
  assert.deepEqual(sw('Canon', 'Тонер colorWAVE T60 голубой', 'hardware'), ['consumables'])
})

test('исключение внутри группы важнее разделов группы', () => {
  assert.deepEqual(sw('Artec 3D', 'Artec Studio 19'), ['scanners', 'machine'])
  assert.deepEqual(sw('SCAD Soft', 'ОТКОС'), ['geotech', 'structural'])
  assert.deepEqual(sw('SCAD Soft', 'ЗАПРОС'), ['geotech', 'structural'])
  assert.deepEqual(sw('НТП Трубопровод', 'ПАССАТ Колонны'), ['pipes', 'machine'])
  assert.deepEqual(sw('НТП Трубопровод', 'СТАРТ-Проф'), ['pipes', 'mep'])
  assert.deepEqual(sw('Autodesk', 'Autodesk Docs'), ['estimate'])
  assert.deepEqual(sw('Autodesk', 'BIM 360 Build'), ['arch', 'estimate'])
  assert.deepEqual(sw('Autodesk', 'Navisworks Manage'), ['arch'])
})

test('Autodesk Premium остаётся без направления', () => {
  assert.deepEqual(sw('Autodesk', 'Premium SUB'), [])
})

test('товар вне правил — null', () => {
  assert.equal(sw('Неизвестный', 'Что-то'), null)
})

test('снятые с продажи программы Autodesk распознаются, действующие — нет', () => {
  assert.equal(isRetired({ vendor: 'Autodesk', title: 'Autodesk SketchBook Pro' }), true)
  assert.equal(isRetired({ vendor: 'Autodesk', title: 'Maya LT' }), true)
  assert.equal(isRetired({ vendor: 'Autodesk', title: 'Maya' }), false)
  assert.equal(isRetired({ vendor: 'Autodesk', title: 'Flame' }), false)
})
