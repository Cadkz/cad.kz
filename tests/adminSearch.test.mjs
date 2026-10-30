import assert from 'node:assert/strict'
import test from 'node:test'
import { HOME_LINK, isActive, MENU, PAGE_TABS, visibleMenu } from '../src/domain/adminMenu.mjs'
import { ADMIN_ACTIONS, matchPages, searchQuery, shortLabel } from '../src/domain/adminSearch.mjs'

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

test('меню по задачам: каждый пункт один раз, порядок групп как у владельца', () => {
  assert.deepEqual(
    MENU.map((group) => group.label),
    ['Каталог', 'Контент', 'Продажи', 'Кадди', 'Настройки'],
  )
  const hrefs = [HOME_LINK.href, ...MENU.flatMap((group) => group.links.map((link) => link.href))]
  assert.equal(new Set(hrefs).size, hrefs.length)
  // Завершённые переезды в меню не показываются — только поиском.
  for (const gone of [
    '/admin/import-bitrix',
    '/admin/legacy-content',
    '/admin/collections/import-runs',
  ])
    assert.ok(!hrefs.includes(gone), gone)
  assert.equal(MENU.at(-1)?.collapsed, true)
})

test('меню по правам: маркетолог не видит заявки, диалоги и Битрикс24', () => {
  const adminOnly = new Set(['site-requests', 'orders', 'conversations', 'users', 'crm-deliveries'])
  const editor = visibleMenu({
    role: 'editor',
    canRead: (kind, slug) => kind === 'global' || !adminOnly.has(slug),
  })
  const labels = editor.flatMap((group) => group.links.map((link) => link.label))
  assert.ok(labels.includes('Цены'))
  assert.ok(labels.includes('База знаний'))
  assert.ok(!labels.includes('Заявки'))
  assert.ok(!labels.includes('Диалоги'))
  assert.ok(!labels.includes('Битрикс24'))
  assert.ok(!editor.some((group) => group.label === 'Продажи'))
  const nobody = visibleMenu({ role: undefined, canRead: () => false })
  assert.equal(nobody.length, 0)
})

test('активный пункт: раздел и записи внутри, Главная — только сама', () => {
  assert.ok(isActive('/admin', '/admin'))
  assert.ok(!isActive('/admin', '/admin/catalog'))
  assert.ok(isActive('/admin/collections/publications', '/admin/collections/publications/12'))
  assert.ok(!isActive('/admin/collections/pages', '/admin/collections/pages-old'))
})

test('вкладки цен: таблица, прайс, курсы, НДС', () => {
  assert.deepEqual(
    PAGE_TABS.prices.map((tab) => tab.href),
    ['/admin/prices', '/admin/price-list', '/admin/rates', '/admin/globals/pricing-settings'],
  )
})

test('команды словами: новость, прайс, без цены; заявки — только администратору', () => {
  assert.equal(
    matchPages('новость', false, ADMIN_ACTIONS)[0].href,
    '/admin/collections/publications/create?kind=news',
  )
  assert.equal(matchPages('прайс', false, ADMIN_ACTIONS)[0].href, '/admin/price-list')
  assert.ok(matchPages('доллар', false, ADMIN_ACTIONS)[0].href === '/admin/rates')
  const noPrice = matchPages('без цены', false, ADMIN_ACTIONS)
  assert.equal(noPrice.length, 1)
  assert.ok(noPrice[0].href.includes('qualityGaps'))
  assert.equal(matchPages('заявки', false, ADMIN_ACTIONS).length, 0)
  assert.equal(matchPages('заявки', true, ADMIN_ACTIONS).length, 1)
})
