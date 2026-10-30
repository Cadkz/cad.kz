import assert from 'node:assert/strict'
import test from 'node:test'
import { groupEntities, KADDI_LINKS } from '../src/domain/adminMenu.mjs'
import { matchPages, searchQuery, shortLabel } from '../src/domain/adminSearch.mjs'

test('строка поиска: пробелы схлопываются, короткая и не строка — null', () => {
  assert.equal(searchQuery('  autocad   lt '), 'autocad lt')
  assert.equal(searchQuery('a'), null)
  assert.equal(searchQuery(5), null)
  assert.equal(searchQuery('x'.repeat(200))?.length, 80)
})

test('страницы админки находятся по названию и словам-подсказкам, служебные — только администратору', () => {
  assert.deepEqual(
    matchPages('проверка кадди', false).map((page) => page.href),
    ['/admin/assistant-check'],
  )
  assert.ok(matchPages('курс', false).some((page) => page.href === '/admin/rates'))
  assert.ok(matchPages('ёлка', false).length === 0)
  assert.equal(matchPages('битрикс24', false).length, 0)
  assert.equal(matchPages('битрикс24', true)[0].href, '/admin/bitrix24')
})

test('подпись записи — первая строка, длинная обрезается', () => {
  assert.equal(shortLabel('Первая\nвторая'), 'Первая')
  assert.equal(shortLabel('я'.repeat(120)).length, 90)
  assert.equal(shortLabel(null), '')
})

test('Кадди одной группой: база знаний и диалоги не дублируются в общих группах', () => {
  assert.deepEqual(
    KADDI_LINKS.map((link) => link.label),
    ['Проверка Кадди', 'База знаний Кадди', 'Прайс и база Кадди', 'Диалоги Кадди'],
  )
  const visible = groupEntities({
    collections: ['products', 'assistant-knowledge', 'conversations'],
    globals: [],
  })
  assert.deepEqual(visible.collections, ['products'])
})
