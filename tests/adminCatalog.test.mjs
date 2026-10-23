import assert from 'node:assert/strict'
import test from 'node:test'
import { availability, compareBy, groupOf, parseSort } from '../src/domain/adminCatalog.mjs'

test('вкладки: программы, оборудование, курсы и услуги вместе', () => {
  assert.equal(groupOf('software'), 'software')
  assert.equal(groupOf('hardware'), 'hardware')
  assert.equal(groupOf('course'), 'service')
  assert.equal(groupOf('service'), 'service')
  assert.equal(groupOf(null), 'service')
})

test('«Сорт.»: пусто, целое до 999 999, остальное — ошибка', () => {
  assert.deepEqual(parseSort(''), { ok: true, value: null })
  assert.deepEqual(parseSort(' 500 '), { ok: true, value: 500 })
  assert.deepEqual(parseSort('0'), { ok: true, value: 0 })
  for (const bad of ['-1', '1.5', '10,5', 'abc', '1000000'])
    assert.equal(parseSort(bad).ok, false, bad)
})

test('доступность: снят и скрыт, из наличия, без страницы, цена или по запросу', () => {
  const base = { research: null, priced: true, ownPage: true }
  assert.equal(availability({ ...base, research: 'discontinued' }).tone, 'warn')
  assert.equal(availability({ ...base, research: 'in-stock' }).label, 'Из наличия')
  assert.equal(availability({ ...base, ownPage: false }).label, 'Без своей страницы')
  assert.equal(availability(base).label, 'Цена на сайте')
  assert.equal(availability({ ...base, priced: false }).label, 'По запросу')
})

test('сортировка колонки: пустые в конце при любом направлении, равные — по названию', () => {
  const rows = [
    { title: 'Б', order: null },
    { title: 'В', order: 20 },
    { title: 'А', order: 10 },
    { title: 'Г', order: 10 },
  ]
  const titles = (dir) => [...rows].sort(compareBy('order', dir)).map((row) => row.title)
  assert.deepEqual(titles('asc'), ['А', 'Г', 'В', 'Б'])
  assert.deepEqual(titles('desc'), ['В', 'А', 'Г', 'Б'])
})

test('сортировка: активные первыми, названия — по-русски (кириллица раньше) и с числами', () => {
  const rows = [
    { title: 'Т', published: false },
    { title: 'С', published: true },
  ]
  assert.deepEqual(
    rows.sort(compareBy('published', 'asc')).map((row) => row.title),
    ['С', 'Т'],
  )
  const names = [{ title: 'TX-4200' }, { title: 'TX-300' }, { title: 'Агент' }]
  assert.deepEqual(
    names.sort(compareBy('title', 'asc')).map((row) => row.title),
    ['Агент', 'TX-300', 'TX-4200'],
  )
})
