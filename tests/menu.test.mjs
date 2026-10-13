import assert from 'node:assert/strict'
import test from 'node:test'
import {
  MENU_LINKS,
  MENU_PER_VENDOR,
  menuColumns,
  menuTitle,
  sectionFilter,
  splitTitle,
} from '../src/domain/menu.mjs'

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
  [3, 'ЛИРА-FEM'],
])
const product = (id, title, main, more = {}) => ({
  id,
  title,
  main,
  sections: [main],
  href: `/products/${id}`,
  vendor: 1,
  ...more,
})

test('раздел → сразу программы: топы первыми, производитель в подсказке', () => {
  const products = [
    product(1, 'AutoCAD', 1, { rank: 3 }),
    product(2, 'КРИСТАЛЛ - экспертиза стальных конструкций', 1, { vendor: 2, rank: 1 }),
    product(3, 'SCAD Office v. 25.1', 1, { vendor: 2, rank: 3 }),
    product(4, 'Robot', 1, { rank: 1 }),
  ]
  const [column] = menuColumns(sections, products, vendors, href)
  // Флагманы выше; внутри уровня — «Первыми в разделе» (SCAD Soft).
  assert.deepEqual(
    column.programs.map((p) => p.title),
    ['SCAD Office v. 25.1', 'AutoCAD', 'КРИСТАЛЛ', 'Robot'],
  )
  assert.deepEqual(column.programs[2], {
    title: 'КРИСТАЛЛ',
    note: 'экспертиза стальных конструкций',
    vendor: 'SCAD Soft',
    href: '/products/2',
  })
  assert.equal(column.more, false)
  assert.equal(column.allHref, '/catalog?direction=arch')
})

test('не больше MENU_LINKS программ, от одного производителя не больше MENU_PER_VENDOR подряд', () => {
  const products = [
    ...Array.from({ length: MENU_LINKS + 3 }, (_, i) => product(i + 1, `GEO5 модуль ${i}`, 1)),
    product(100, 'ЛИРА-FEM', 1, { vendor: 3 }),
  ]
  const [column] = menuColumns(sections, products, vendors, href)
  assert.equal(column.programs.length, MENU_LINKS)
  assert.equal(column.more, true)
  // ЛИРА того же уровня не утонула под модулями одного производителя.
  assert.ok(column.programs.some((p) => p.title === 'ЛИРА-FEM'))
  assert.ok(MENU_PER_VENDOR < MENU_LINKS)
})

test('пустые разделы не показываются, тип — с группой в адресе', () => {
  const columns = menuColumns(sections, [product(1, 'Плоттер', 2)], vendors, href)
  assert.deepEqual(
    columns.map((column) => column.title),
    ['Плоттеры'],
  )
  assert.deepEqual(sectionFilter(sections[0]), { direction: 'arch' })
  assert.equal(columns[0].allHref, '/catalog?group=hardware&type=plotters')
})

test('в меню без канцелярского начала названия, пояснение после тире отдельно', () => {
  assert.equal(menuTitle('Право на использование программного обеспечения V-Ray 5'), 'V-Ray 5')
  assert.deepEqual(splitTitle('АРБАТ – подбор арматуры'), ['АРБАТ', 'подбор арматуры'])
  assert.deepEqual(splitTitle('ЛИРА-FEM'), ['ЛИРА-FEM', null])
})

test('курс с направлением не попадает в раздел программ', () => {
  const products = [
    product(1, 'Civil 3D', 1, { group: 'software' }),
    product(2, 'Онлайн курс Civil 3D', 9, { group: 'service', sections: [9, 1] }),
  ]
  const [column] = menuColumns(sections, products, vendors, href)
  assert.deepEqual(
    column.programs.map((p) => p.title),
    ['Civil 3D'],
  )
})
