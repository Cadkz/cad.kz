import assert from 'node:assert/strict'
import test from 'node:test'
import { cleanSpecs, groupSpecs, normalizeSpecValue, splitSpecName } from '../src/domain/specs.mjs'

test('характеристики: группа отдельно от названия', () => {
  assert.deepEqual(splitSpecName('Точность — Точность 3D'), {
    group: 'Точность',
    name: 'Точность 3D',
  })
  assert.deepEqual(splitSpecName('Артикул'), { group: null, name: 'Артикул' })
})

test('характеристики: английские единицы по-русски', () => {
  assert.equal(normalizeSpecValue('0.4-1.0 m'), '0,4–1,0 м')
  assert.equal(normalizeSpecValue('0.9 kg'), '0,9 кг')
  assert.equal(normalizeSpecValue('up to 18 million points/s'), 'до 18 млн точек/с')
  assert.equal(normalizeSpecValue('214 x 148 to 536 x 371 mm'), '214 × 148 – 536 × 371 мм')
  assert.equal(normalizeSpecValue('15-30 C'), '15–30 °C')
  assert.equal(
    normalizeSpecValue('48-bit color, 16-bit grayscale'),
    '48 бит цвет, 16 бит оттенки серого',
  )
  assert.equal(normalizeSpecValue('C, M, Y, K'), 'C, M, Y, K')
  assert.equal(normalizeSpecValue('600 dpi'), '600 dpi')
})

test('характеристики Artec Eva: без английских дублей, масса и скорость в своих группах', () => {
  const specs = cleanSpecs([
    { name: 'Точность — Точность 3D', value: 'до 0,1 мм' },
    { name: 'Сканирование — Рабочая дистанция', value: '0,4–1,0 м' },
    { name: 'Точность — Масса', value: '0.9 kg' },
    { name: 'Точность — Рабочая дистанция', value: '0.4-1.0 m' },
    { name: 'Точность — Точность 3D', value: '0.1 mm' },
    { name: 'Точность — Вес', value: 'up to 18 million points/s' },
  ])
  assert.deepEqual(
    specs.map((s) => `${s.group}|${s.name}|${s.value}`),
    [
      'Точность|Точность 3D|до 0,1 мм',
      'Сканирование|Рабочая дистанция|0,4–1,0 м',
      'Конструкция|Масса|0,9 кг',
      'Сканирование|Скорость захвата|до 18 млн точек/с',
    ],
  )
})

test('характеристики: одно значение в разных единицах склеивается', () => {
  const specs = cleanSpecs([
    { name: 'Печать — Максимальная ширина носителя', value: '36 дюйм' },
    { name: 'Печать — Максимальная ширина носителя', value: '914 мм' },
    { name: 'Точность — Точность 3D-точки', value: 'до 0,1 мм' },
    { name: 'Точность — Точность 3D', value: '0.1 mm' },
  ])
  assert.deepEqual(
    specs.map((s) => s.value),
    ['36 дюйм / 914 мм', 'до 0,1 мм'],
  )
})

test('характеристики по группам: без группы первыми, дальше по порядку', () => {
  const groups = groupSpecs(
    cleanSpecs([
      { name: 'Печать — Технология', value: 'CrystalPoint' },
      { name: 'Артикул', value: '123' },
      { name: 'Материалы — Число рулонов', value: 'до 6' },
      { name: 'Печать — Разрешение', value: '600 dpi' },
    ]),
  )
  assert.deepEqual(
    groups.map((g) => [g.group, g.items.length]),
    [
      [null, 1],
      ['Печать', 2],
      ['Материалы', 1],
    ],
  )
})
