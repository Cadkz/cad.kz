import assert from 'node:assert/strict'
import test from 'node:test'
import { pluginBadge, showVendorLine } from '../src/domain/cardNoise.mjs'

test('производитель не повторяется, если название с него начинается', () => {
  assert.equal(showVendorLine('MagiCAD', 'MagiCAD Вентиляция для AutoCAD'), false)
  assert.equal(showVendorLine('Autodesk', 'AutoCAD'), true)
  assert.equal(showVendorLine('Fine Software', 'GEO5 Плита'), true)
  assert.equal(showVendorLine(null, 'AutoCAD'), false)
})

test('плашка плагина — только если программы нет в названии', () => {
  assert.equal(pluginBadge(['AutoCAD'], 'MagiCAD Вентиляция для AutoCAD'), null)
  assert.equal(pluginBadge(['AutoCAD'], 'СПДС GraphiCS'), 'Плагин для AutoCAD')
  assert.equal(pluginBadge(['AutoCAD', 'Inventor'], 'MechaniCS для AutoCAD'), 'Плагин для Inventor')
  assert.equal(pluginBadge(['AutoCAD'], 'MagiCAD для AutoCAD LT'), null)
})
