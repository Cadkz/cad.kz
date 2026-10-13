import assert from 'node:assert/strict'
import test from 'node:test'
import { addonBases } from '../src/domain/addonsSeed.mjs'
import { searchDetailed, searchItems } from '../src/domain/search.mjs'

// Как на демо 13.10.2026: «автокад» находил всё, где AutoCAD упомянут в описании.
const items = [
  { key: 82, title: 'AutoCAD', vendor: 'Autodesk', parts: 'AutoCAD AutoCAD LT' },
  { key: 85, title: 'AutoCAD Revit LT Suite', vendor: 'Autodesk' },
  { key: 89, title: 'Revit', vendor: 'Autodesk', summary: 'BIM-платформа' },
  {
    key: 120,
    title: 'Civil 3D',
    vendor: 'Autodesk',
    summary: 'Autodesk AutoCAD Civil 3D – универсальная среда для генплана',
  },
  {
    key: 237,
    title: 'Курс Civil 3D. Проектирование автомобильных дорог',
    summary: 'Оформлять документацию в AutoCAD Civil 3D',
  },
  {
    key: 394,
    title: 'Point Layout',
    vendor: 'Autodesk',
    summary: 'Программа, совместимая с AutoCAD, Revit и Navisworks',
  },
  {
    key: -7,
    members: [263, 261],
    addonOf: [82],
    title: 'MagiCAD для AutoCAD',
    vendor: 'MagiCAD',
    parts: 'MagiCAD Вентиляция MagiCAD Трубопроводы',
  },
  {
    key: 611,
    addonOf: [82],
    title: 'СПДС GraphiCS',
    vendor: 'Csoft Development',
    summary: 'Приложение к AutoCAD',
  },
  { key: 580, addonOf: [89], title: 'Revit - Гидросистема', vendor: 'НТП Трубопровод' },
  {
    key: 264,
    title: 'MagiCAD Вентиляция для Revit',
    vendor: 'MagiCAD',
    summary: 'Вентиляция',
  },
  { key: 999, title: 'Вентилятор канальный', summary: 'вентиляция помещений' },
]
const titles = (list) => list.map((item) => item.title)

test('«автокад»: только AutoCAD в названии, дополнения отдельно, без упоминаний в описании', () => {
  const found = searchDetailed(items, 'автокад')
  assert.deepEqual(titles(found.items), ['AutoCAD', 'AutoCAD Revit LT Suite'])
  assert.deepEqual(titles(found.addons), ['MagiCAD для AutoCAD', 'СПДС GraphiCS'])
  assert.deepEqual(found.bases, ['AutoCAD'])
})

test('«ревит»: программы НТП для Revit уходят в дополнения', () => {
  const found = searchDetailed(items, 'ревит')
  assert.equal(found.items[0].title, 'Revit')
  assert.ok(!titles(found.items).includes('Revit - Гидросистема'))
  assert.deepEqual(titles(found.addons), ['Revit - Гидросистема'])
})

test('запрос-задача ищет и по описанию, как раньше', () => {
  const found = searchDetailed(items, 'вентиляция')
  assert.ok(titles(found.items).includes('Вентилятор канальный'))
  assert.deepEqual(found.addons, [])
})

test('подсказки: дополнения после программ', () => {
  assert.deepEqual(titles(searchItems(items, 'autocad')), [
    'AutoCAD',
    'AutoCAD Revit LT Suite',
    'MagiCAD для AutoCAD',
    'СПДС GraphiCS',
  ])
})

test('правила дополнений: линейка, название, исключения', () => {
  assert.deepEqual(addonBases({ title: 'MagiCAD Вентиляция', line: 'MagiCAD для AutoCAD' }), [
    'AutoCAD',
  ])
  assert.deepEqual(addonBases({ title: 'MagiCAD Suite Схемы', line: null }), ['AutoCAD'])
  assert.deepEqual(addonBases({ title: 'MechaniCS', line: 'MechaniCS' }), [
    'AutoCAD',
    'Inventor Professional',
  ])
  assert.deepEqual(addonBases({ title: 'Revit - СТАРТ', line: 'Программы НТП для Revit' }), [
    'Revit',
  ])
  assert.deepEqual(
    addonBases({ title: 'Подписка на обновления TDMS (AddIns for AutoCAD)', line: 'TDMS' }),
    [],
  )
  assert.deepEqual(addonBases({ title: 'TDMS (7.x (AddIns for AutoCAD)', line: 'TDMS' }), [
    'AutoCAD',
  ])
  assert.deepEqual(addonBases({ title: 'Курс MagiCAD', kind: 'course', line: null }), [])
})
