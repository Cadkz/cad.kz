import assert from 'node:assert/strict'
import test from 'node:test'
import { MENU_LINKS, menuColumns, sectionFilter } from '../src/domain/menu.mjs'

const href = (filter) => `/?${new URLSearchParams(filter)}#catalog`
const sections = [
  { id: 1, slug: 'arch', title: 'Архитектура', menuGroup: 'software', isDirection: true },
  { id: 2, slug: 'plotters', title: 'Плоттеры', menuGroup: 'hardware', isDirection: false },
  { id: 3, slug: 'empty', title: 'Пустой', menuGroup: 'hardware', isDirection: false },
]
const product = (id, title, main, extra = []) => ({
  id,
  title,
  main,
  sections: [main, ...extra],
  href: `/products/${id}`,
})

test('в колонке не больше MENU_LINKS товаров, всего — сколько есть', () => {
  const products = Array.from({ length: 12 }, (_, i) => product(i + 1, `Товар ${i + 10}`, 1))
  const [column] = menuColumns(sections, products, href)
  assert.equal(column.links.length, MENU_LINKS)
  assert.equal(column.total, 12)
})

test('сначала товары с основным разделом, потом по названию', () => {
  const products = [product(1, 'Альфа', 2, [1]), product(2, 'Вега', 1), product(3, 'Бета', 1)]
  const [column] = menuColumns(sections, products, href)
  assert.deepEqual(
    column.links.map((link) => link.title),
    ['Бета', 'Вега', 'Альфа'],
  )
})

test('пустые разделы не показываются', () => {
  const columns = menuColumns(sections, [product(1, 'Плоттер', 2)], href)
  assert.deepEqual(
    columns.map((column) => column.title),
    ['Плоттеры'],
  )
})

test('«Все N» ведёт в каталог: направление — без группы, тип — с группой', () => {
  assert.deepEqual(sectionFilter(sections[0]), { direction: 'arch' })
  assert.deepEqual(sectionFilter(sections[1]), { group: 'hardware', type: 'plotters' })
  const [column] = menuColumns(sections, [product(1, 'Плоттер', 2)], href)
  assert.equal(column.allHref, '/?group=hardware&type=plotters#catalog')
})
