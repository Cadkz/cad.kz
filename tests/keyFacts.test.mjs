import assert from 'node:assert/strict'
import test from 'node:test'
import { keyFacts } from '../src/domain/keyFacts.mjs'
import { cleanSpecs } from '../src/domain/specs.mjs'

const list = (facts) => facts.map((f) => `${f.name}: ${f.value}`)

test('главные факты плоттера: ширина, технология, скорость', () => {
  const specs = cleanSpecs([
    { name: 'Печать — Технология', value: 'CrystalPoint' },
    { name: 'Печать — Расходник', value: 'TonerPearls' },
    { name: 'Производительность — Черно-белых D-форматов', value: 'до 225 лист/час' },
  ])
  const filters = { width: ['42"'], technology: ['CrystalPoint/TonerPearls'], color: ['Цветной'] }
  assert.deepEqual(list(keyFacts({ category: 'plotters', filters }, specs)), [
    'Ширина печати: 42"',
    'Технология: CrystalPoint/TonerPearls',
    'Скорость печати: до 225 лист/час',
  ])
})

test('главные факты 3D-сканера: точность, провод, технология', () => {
  const filters = { accuracy: ['0,1 мм'], wireless: ['Да'], technology: ['Структурированный свет'] }
  assert.deepEqual(list(keyFacts({ category: '3d-scanners', filters }, [])), [
    'Точность: до 0,1 мм',
    'Подключение: Беспроводной',
    'Технология: Структурированный свет',
  ])
})

test('главные факты широкоформатного сканера: ширина, скорость, конструкция', () => {
  const specs = cleanSpecs([{ name: 'Сканирование — Скорость 300 dpi', value: '< 3 s' }])
  const filters = {
    width: ['25"'],
    form: ['Планшетный'],
    sensor: ['CCD'],
    resolution: ['1200 x 600 dpi'],
  }
  assert.deepEqual(list(keyFacts({ category: 'wide-scanners', filters }, specs)), [
    'Ширина сканирования: 25"',
    'Скорость: менее 3 с',
    'Конструкция: Планшетный, CCD',
  ])
})

test('без исследования — первые короткие характеристики', () => {
  const specs = cleanSpecs([
    { name: 'Процессор', value: 'Intel Core i9' },
    { name: 'Описание', value: 'Очень длинное значение, которое не влезет в подпись у фото' },
  ])
  assert.deepEqual(list(keyFacts(null, specs)), ['Процессор: Intel Core i9'])
})
