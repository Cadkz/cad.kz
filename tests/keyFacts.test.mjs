import assert from 'node:assert/strict'
import test from 'node:test'
import { keyFacts, objectSize } from '../src/domain/keyFacts.mjs'
import { cleanSpecs } from '../src/domain/specs.mjs'

const list = (facts) => facts.map((f) => `${f.name}: ${f.value}`)

test('главные факты плоттера как у Canon: скорость, цветность, ширина, разрешение, рулоны', () => {
  const specs = cleanSpecs([
    { name: 'Печать — Разрешение', value: '600 × 1200 dpi' },
    { name: 'Материалы — Максимальная ширина', value: '36 дюйм' },
    { name: 'Материалы — Максимальная ширина', value: '914 мм' },
    { name: 'Производительность — A1', value: '10 лист/мин' },
    { name: 'Сканирование — Разрешение', value: '600 x 600 dpi' },
  ])
  const filters = { width: ['36" (A0)'], color: ['Монохромный'], rolls: ['4 или 6'] }
  const facts = keyFacts({ category: 'plotters', filters }, specs)
  assert.deepEqual(list(facts), [
    'Скорость печати: до 10 листов A1 в минуту',
    'Цветность: Чёрно-белая',
    'Ширина рулона: 914 мм (36″)',
    'Разрешение: до 600 × 1200 dpi',
    'Подача: 4 или 6 рулонов',
  ])
  assert.equal(facts[1]?.icon, 'mono')
  // Без характеристик: миллиметры из дюймов фильтра, «до 4» — рулонов, скорость в час.
  const short = keyFacts(
    { category: 'plotters', filters: { width: ['42"'], color: ['Цветной'], rolls: ['до 4'] } },
    cleanSpecs([{ name: 'Производительность — D-форматов', value: 'до 225 лист/час' }]),
  )
  assert.deepEqual(list(short), [
    'Скорость печати: до 225 листов в час',
    'Цветность: Цветная',
    'Ширина рулона: 1067 мм (42″)',
    'Подача: до 4 рулонов',
  ])
})

test('главные факты 3D-сканера: точность, провод, размер предметов', () => {
  const filters = {
    accuracy: ['0,1 мм'],
    wireless: ['Да'],
    technology: ['Структурированный свет'],
    object_size: ['M (20–50 см)', 'L (50–200 см)'],
  }
  assert.deepEqual(list(keyFacts({ category: '3d-scanners', filters }, [])), [
    'Точность: до 0,1 мм',
    'Подключение: Беспроводной',
    'Размер предметов: 20 см – 2 м',
  ])
  // Размера нет — третьей технология.
  const { object_size: _, ...noSize } = filters
  assert.equal(
    list(keyFacts({ category: '3d-scanners', filters: noSize }, []))[2],
    'Технология: Структурированный свет',
  )
})

test('размер предметов одним диапазоном', () => {
  assert.equal(objectSize({ object_size: ['XS (<5 см)', 'S (5–20 см)'] }), 'до 20 см')
  assert.equal(objectSize({ object_size: ['S (5–20 см)', 'M (20–50 см)'] }), '5–50 см')
  assert.equal(objectSize({ object_size: ['L (50–200 см)', 'XL (>200 см)'] }), 'от 50 см и крупнее')
  assert.equal(
    objectSize({ object_size: ['XL (>200 см)', 'XXL (пространства)'] }),
    'от 2 м, помещения и здания',
  )
  assert.equal(objectSize({}), null)
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
