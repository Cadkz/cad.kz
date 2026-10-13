import assert from 'node:assert/strict'
import test from 'node:test'
import { MENU_LINKS, menuColumns, menuTitle, sectionFilter } from '../src/domain/menu.mjs'

const href = (filter) => `/catalog?${new URLSearchParams(filter)}`
const sections = [
  {
    id: 1,
    slug: 'arch',
    title: 'Архитектура',
    menuGroup: 'software',
    isDirection: true,
    pins: [2],
  },
  { id: 2, slug: 'plotters', title: 'Плоттеры', menuGroup: 'hardware', isDirection: false },
  { id: 3, slug: 'empty', title: 'Пустой', menuGroup: 'hardware', isDirection: false },
]
const vendors = new Map([
  [1, 'Autodesk'],
  [2, 'SCAD Soft'],
])
const lines = [
  { id: 10, title: 'Сателлиты', vendor: 2, order: 20 },
  { id: 11, title: 'Программный комплекс', vendor: 2, order: 10 },
  { id: 12, title: 'Справочники', vendor: 2, order: 30 },
]
const product = (id, title, main, more = {}) => ({
  id,
  title,
  main,
  sections: [main],
  href: `/products/${id}`,
  vendor: 1,
  ...more,
})

test('раздел → производители по «Первыми в разделе» → линейки по порядку → товары', () => {
  const products = [
    product(1, 'AutoCAD', 1, { rank: 3 }),
    product(2, 'КРИСТАЛЛ', 1, { vendor: 2, line: 10, lineOrder: 1 }),
    product(3, 'SCAD комплект RC', 1, { vendor: 2, line: 11, lineOrder: 3 }),
    product(4, 'SCAD Office v. 25.1', 1, { vendor: 2, line: 11, lineOrder: 1 }),
    product(5, 'Без линейки', 1, { vendor: 2 }),
  ]
  const [column] = menuColumns(sections, products, lines, vendors, href)
  assert.deepEqual(
    column.vendors.map((v) => v.title),
    ['SCAD Soft', 'Autodesk'],
  )
  const scad = column.vendors[0]
  assert.deepEqual(
    scad.lines.map((l) => l.title),
    ['Программный комплекс', 'Сателлиты', 'Другие программы'],
  )
  assert.deepEqual(
    scad.lines[0].links.map((l) => l.title),
    ['SCAD Office v. 25.1', 'SCAD комплект RC'],
  )
  assert.equal(scad.allHref, '/catalog?direction=arch&vendor=SCAD+Soft')
  assert.equal(scad.lines[0].allHref, '/catalog?direction=arch&vendor=SCAD+Soft&line=11')
  // У производителя без линеек одна группа с его названием.
  assert.deepEqual(
    column.vendors[1].lines.map((l) => l.title),
    ['Autodesk'],
  )
})

test('в линейке не больше MENU_LINKS товаров, остальные — «Смотреть все»', () => {
  const products = Array.from({ length: MENU_LINKS + 3 }, (_, i) => product(i + 1, `Товар ${i}`, 1))
  const [column] = menuColumns(sections, products, lines, vendors, href)
  assert.equal(column.vendors[0].lines[0].links.length, MENU_LINKS)
  assert.equal(column.vendors[0].lines[0].more, true)
})

test('пустые разделы не показываются, тип — с группой в адресе', () => {
  const columns = menuColumns(sections, [product(1, 'Плоттер', 2)], lines, vendors, href)
  assert.deepEqual(
    columns.map((column) => column.title),
    ['Плоттеры'],
  )
  assert.deepEqual(sectionFilter(sections[0]), { direction: 'arch' })
  assert.equal(columns[0].allHref, '/catalog?group=hardware&type=plotters')
})

test('в меню без канцелярского начала названия', () => {
  assert.equal(menuTitle('Право на использование программного обеспечения V-Ray 5'), 'V-Ray 5')
})

test('курс с направлением не попадает в раздел программ', () => {
  const products = [
    product(1, 'Civil 3D', 1, { group: 'software' }),
    product(2, 'Онлайн курс Civil 3D', 9, { group: 'service', sections: [9, 1] }),
  ]
  const [column] = menuColumns(sections, products, lines, vendors, href)
  const titles = column.vendors.flatMap((v) => v.lines.flatMap((l) => l.links.map((x) => x.title)))
  assert.deepEqual(titles, ['Civil 3D'])
})
