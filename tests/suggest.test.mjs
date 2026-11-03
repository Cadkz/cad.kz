import assert from 'node:assert/strict'
import test from 'node:test'
import { searchItems } from '../src/domain/search.mjs'
import { groupSuggestions, markMatches, suggest } from '../src/domain/suggest.mjs'

const product = (title, vendor, summary = '') => ({
  type: 'product',
  title,
  href: `/p/${title}`,
  label: 'Программа',
  note: vendor,
  vendor,
  summary,
})

const index = {
  products: [
    product('SCAD Office', 'SCAD Soft', 'Расчёт конструкций'),
    product('SCAD++ Железобетон', 'SCAD Soft'),
    { ...product('Программы-сателлиты SCAD Office', 'SCAD Soft'), type: 'family' },
    product('AutoCAD', 'Autodesk', 'Черчение'),
    product('Revit', 'Autodesk', 'BIM'),
    product('Онлайн курс Revit', 'CAD.kz'),
    product('Artec Leo', 'Artec 3D', 'Беспроводной 3D-сканер'),
    ...Array.from({ length: 10 }, (_, i) => product(`GEO5 Модуль ${i + 1}`, 'Fine')),
  ],
  vendors: [
    {
      type: 'vendor',
      title: 'SCAD Soft',
      href: '/catalog?vendor=SCAD+Soft',
      label: 'Производитель',
    },
    { type: 'vendor', title: 'Autodesk', href: '/catalog?vendor=Autodesk', label: 'Производитель' },
  ],
  sections: [
    {
      type: 'section',
      title: 'Расчёт конструкций',
      href: '/catalog?direction=structural',
      label: 'Раздел каталога',
    },
  ],
  pages: [
    {
      type: 'page',
      title: 'Контакты',
      summary: 'телефон адрес',
      href: '/contacts',
      label: 'Страница',
    },
  ],
}
const titles = (query) => suggest(index, query).items.map((item) => item.title)

test('SCAD: сначала программы, потом производитель', () => {
  assert.deepEqual(titles('scad'), [
    'SCAD Office',
    'SCAD++ Железобетон',
    'Программы-сателлиты SCAD Office',
    'SCAD Soft',
  ])
})

test('группы как в мегаменю: программы, дополнения «для …», курсы (03.11.2026)', () => {
  const own = {
    ...index,
    products: [
      product('AutoCAD', 'Autodesk'),
      product('AutoCAD LT', 'Autodesk'),
      product('MagiCAD Вентиляция для AutoCAD', 'MagiCAD'),
      { ...product('Онлайн курс AutoCAD', 'CAD.kz'), label: 'Курс' },
    ],
  }
  const groups = groupSuggestions(suggest(own, 'автокад').items).map((group) => [
    group.key,
    group.items.map((item) => item.title),
  ])
  assert.deepEqual(groups, [
    ['products', ['AutoCAD', 'AutoCAD LT']],
    ['addons', ['MagiCAD Вентиляция для AutoCAD']],
    ['courses', ['Онлайн курс AutoCAD']],
  ])
  // Сама MagiCAD по запросу «магикад» — программа, а не дополнение.
  assert.equal(groupSuggestions(suggest(own, 'магикад').items)[0]?.key, 'products')
})

test('«автокад»: сама программа, LT, коллекция с AutoCAD в составе; без подписок (03.11.2026)', () => {
  const own = {
    ...index,
    products: [
      product('AutoCAD', 'Autodesk'),
      { ...product('LT комплект: AutoCAD + Revit', 'Autodesk'), parts: 'AutoCAD LT Revit LT' },
      product('AutoCAD LT', 'Autodesk'),
      { ...product('Подписка на обновления TDMS', 'TDMS'), parts: 'TDMS AddIns for AutoCAD' },
      {
        ...product('Architecture Engineering & Construction Collection', 'Autodesk'),
        aliases: 'AEC Collection, AECC',
        parts: 'Revit AutoCAD с отраслевыми наборами Civil 3D',
      },
    ],
  }
  const found = suggest(own, 'автокад').items
  assert.deepEqual(
    found.map((item) => item.title),
    [
      'AutoCAD',
      'AutoCAD LT',
      'LT комплект: AutoCAD + Revit',
      'Architecture Engineering & Construction Collection',
    ],
  )
  assert.equal(found[0]?.logo, '/images/brands/autodesk/autocad.png')
  // О продлении спросили — подписка находится.
  assert.ok(
    suggest(own, 'подписка tdms').items.some((i) => i.title === 'Подписка на обновления TDMS'),
  )
  assert.equal(suggest(own, 'aec').items[0]?.title.startsWith('Architecture'), true)
})

test('регистр, кириллица и опечатки', () => {
  assert.equal(titles('ревит')[0], 'Revit')
  assert.equal(titles('АВТОКАД')[0], 'AutoCAD')
  assert.equal(titles('скад')[0], 'SCAD Office')
})

test('в группе товаров не больше пяти строк, остальное — флаг «ещё»', () => {
  const result = suggest(index, 'geo5')
  assert.equal(result.items.filter((item) => item.group === 'products').length, 5)
  assert.equal(result.more, true)
  assert.equal(suggest(index, 'artec').more, false)
})

test('разделы и страницы сайта', () => {
  assert.deepEqual(titles('расчет'), ['SCAD Office', 'Расчёт конструкций'])
  assert.deepEqual(titles('телефон'), ['Контакты'])
})

test('пустой и короткий запрос — без подсказок, ничего не нашлось — пусто', () => {
  assert.deepEqual(titles(''), [])
  assert.deepEqual(titles('s'), [])
  assert.deepEqual(titles('подпорная стена'), [])
})

test('окончания: «курсы» находит «курс», «сканеры» — «сканер»', () => {
  const items = [{ title: 'Онлайн курс Revit' }, { title: 'Artec Leo', summary: '3D-сканер' }]
  assert.deepEqual(
    searchItems(items, 'курсы revit').map((item) => item.title),
    ['Онлайн курс Revit'],
  )
  assert.deepEqual(
    searchItems(items, 'сканеры').map((item) => item.title),
    ['Artec Leo'],
  )
})

test('производители, разделы и страницы — без находок с опечаткой', () => {
  const pages = {
    ...index,
    pages: [{ type: 'page', title: 'Каталог', summary: 'cad', href: '/', label: '' }],
  }
  assert.equal(
    suggest(pages, 'scad').items.some((item) => item.type === 'page'),
    false,
  )
})

test('другие названия из админки: «акад» находит AutoCAD', () => {
  const items = [{ title: 'SCAD Office' }, { title: 'AutoCAD', aliases: 'акад, автокад' }]
  assert.deepEqual(
    searchItems(items, 'акад').map((item) => item.title),
    ['AutoCAD'],
  )
})

test('группы подсказок: товары и семейства первыми, пустые группы не показываются', () => {
  const items = [
    { type: 'vendor', title: 'SCAD Soft' },
    { type: 'product', title: 'SCAD Office' },
    { type: 'family', title: 'Программы-сателлиты' },
    { type: 'page', title: 'Контакты' },
  ]
  const groups = groupSuggestions(items)
  assert.deepEqual(
    groups.map((group) => [group.title, group.items.map((item) => item.title)]),
    [
      ['Товары', ['SCAD Office', 'Программы-сателлиты']],
      ['Производители', ['SCAD Soft']],
      ['Страницы сайта', ['Контакты']],
    ],
  )
})

test('выделение совпадения: с начала слова, без учёта регистра и «ё»', () => {
  const marked = (title, query) =>
    markMatches(title, query)
      .filter((part) => part.match)
      .map((part) => part.text)
  assert.deepEqual(marked('SCAD Office', 'scad'), ['SCAD'])
  assert.deepEqual(marked('SCAD Office', 'off sc'), ['SC', 'Off'])
  assert.deepEqual(marked('SCAD Office', 'ad'), [])
  assert.deepEqual(marked('Расчёт оснований', 'расчет'), ['Расчёт'])
  assert.deepEqual(marked('SCAD Office', 'скад'), [])
  assert.equal(
    markMatches('Artec Leo', 'leo')
      .map((part) => part.text)
      .join(''),
    'Artec Leo',
  )
})
