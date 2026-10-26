import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import test from 'node:test'
import { catalogKind, collectionOf, shortTitle } from '../src/domain/catalogKinds.mjs'

// Node читает TypeScript без сборки; разрешаем внутренние импорты проверяемого модуля.
const hooks = registerHooks({
  resolve(specifier, context, next) {
    return next(
      ['./catalogFilter', './plural'].includes(specifier) &&
        context.parentURL?.includes('/src/lib/')
        ? new URL(`${specifier}.ts`, context.parentURL).href
        : specifier,
      context,
    )
  },
})
const {
  cardInfo,
  collectionContents,
  landingShelves,
  popularEntries,
  sectionShelves,
  sectionView,
  tileState,
} = await import('../src/lib/catalogShelves.ts')
hooks.deregister()

const item = (id, title, extra = {}) => ({
  id,
  title,
  href: `/catalog/x/${id}/`,
  group: 'software',
  directions: ['estimate'],
  types: [],
  vendor: 'АВС',
  manufacturer: 'АВС',
  line: null,
  lineOrder: null,
  scope: 'all',
  rank: 1,
  main: 'estimate',
  tasks: [],
  summary: null,
  picture: null,
  icon: null,
  priceFrom: null,
  offersCount: 0,
  cartOfferId: null,
  badge: null,
  scenario: 'standard',
  aliases: null,
  ...extra,
})

const facets = [
  { slug: 'estimate', title: 'Сметы', group: 'software', isDirection: true, pins: [] },
  { slug: 'arch', title: 'BIM', group: 'software', isDirection: true, pins: [] },
  { slug: 'wide-format', title: 'Широкоформат', group: 'hardware', isDirection: false },
  {
    slug: 'plotters',
    title: 'Плоттеры',
    group: 'hardware',
    isDirection: false,
    parent: 'wide-format',
  },
  {
    slug: 'consumables',
    title: 'Расходные материалы',
    group: 'hardware',
    isDirection: false,
    parent: 'wide-format',
  },
  { slug: 'training', title: 'Обучение', group: 'service', isDirection: false },
]

const items = [
  item(1, 'Программный комплекс АВС-KZ (АВС-4)', { rank: 108 }),
  item(2, 'АВС АККОРД', { rank: 2 }),
  item(3, 'ОНВ РЭО сметно нормативная база', { scenario: 'renewal' }),
  item(4, 'Takeoff CLOUD', { vendor: 'Autodesk', manufacturer: 'Autodesk' }),
  item(5, 'Architecture Engineering & Construction Collection', {
    directions: ['arch'],
    main: 'arch',
    vendor: 'Autodesk',
  }),
  item(6, 'Revit', { directions: ['arch'], main: 'arch', vendor: 'Autodesk', rank: 107 }),
  item(7, 'Canon colorWAVE T65', {
    group: 'hardware',
    directions: [],
    types: ['wide-format', 'plotters'],
    vendor: 'Canon',
  }),
  item(8, 'картридж Océ ColorWave 650 Black', {
    group: 'hardware',
    directions: [],
    types: ['wide-format', 'consumables'],
    vendor: 'Canon',
  }),
  item(9, 'Курс Revit', { group: 'service', directions: [], types: ['training'], vendor: null }),
  item(-2, 'Программы-сателлиты', {
    scope: 'family',
    line: '2',
    vendor: 'SCAD Soft',
    directions: ['arch'],
  }),
  item(10, 'АРБАТ — подбор арматуры', { scope: 'detail', line: '2', vendor: 'SCAD Soft' }),
  item(11, 'КРИСТАЛЛ — сталь', { scope: 'detail', line: '2', vendor: 'SCAD Soft' }),
]

test('тип позиции одним словом', () => {
  const kind = (id) => catalogKind(items.find((entry) => entry.id === id))
  assert.equal(kind(1), 'Программа')
  assert.equal(kind(3), 'Нормативная база')
  assert.equal(kind(5), 'Коллекция')
  assert.equal(kind(7), 'Плоттер')
  assert.equal(kind(8), 'Расходный материал')
  assert.equal(kind(9), 'Курс')
  assert.equal(kind(-2), 'Линейка')
  assert.equal(catalogKind(item(0, 'Base: блок расчета фундаментов')), 'Модуль')
  assert.equal(catalogKind(item(0, 'LT комплект: AutoCAD + Revit')), 'Комплект')
})

test('короткие имена для перечислений', () => {
  assert.equal(shortTitle('Программный комплекс АВС-KZ (АВС-4)'), 'АВС-KZ')
  assert.equal(shortTitle('SCAD Office v. 25.1'), 'SCAD Office')
  assert.equal(shortTitle('ЛИРА - FEM (ЛИРА САПР)'), 'ЛИРА-FEM')
  assert.equal(shortTitle('Architecture Engineering & Construction Collection'), 'AEC Collection')
  assert.equal(collectionOf('Revit'), null)
})

test('обзор: разделы с примерами без расходников', () => {
  const shelves = landingShelves(items, facets)
  const estimate = shelves.software.find((tile) => tile.slug === 'estimate')
  assert.equal(estimate?.count, 4)
  assert.deepEqual(estimate?.examples.slice(0, 2), ['АВС-KZ', 'АВС АККОРД'])
  const wide = shelves.hardware.find((tile) => tile.slug === 'wide-format')
  assert.deepEqual(wide?.examples, ['Canon colorWAVE T65'])
  assert.equal(
    shelves.hardware.some((tile) => tile.slug === 'plotters'),
    false,
  )
  assert.equal(shelves.service[0]?.slug, 'training')
})

test('раздел — полки по производителям, широкоформат — по подразделам', () => {
  const estimate = sectionShelves(
    items,
    facets,
    tileState({ slug: 'estimate', group: 'software', isDirection: true }),
  )
  assert.deepEqual(
    estimate.map((shelf) => [shelf.title, shelf.items.length]),
    [
      ['АВС', 3],
      ['Autodesk', 1],
    ],
  )
  const wide = sectionShelves(
    items,
    facets,
    tileState({ slug: 'wide-format', group: 'hardware', isDirection: false }),
  )
  assert.deepEqual(
    wide.map((shelf) => shelf.title),
    ['Плоттеры', 'Расходные материалы'],
  )
})

test('плашки раздела: подразделы видны и в подразделе', () => {
  const state = tileState({ slug: 'plotters', group: 'hardware', isDirection: false })
  const view = sectionView(items, facets, [], state)
  assert.equal(view.head?.slug, 'wide-format')
  assert.equal(view.chipsAre, 'Подраздел')
  assert.deepEqual(
    view.chips.map((chip) => [chip.label, chip.selected]),
    [
      ['Все', false],
      ['Плоттеры', true],
      ['Расходные материалы', false],
    ],
  )
  const estimate = sectionView(
    items,
    facets,
    [],
    tileState({ slug: 'estimate', group: 'software', isDirection: true }),
  )
  assert.deepEqual(
    estimate.chips.map((chip) => chip.label),
    ['Все', 'АВС', 'Autodesk'],
  )
  assert.equal(estimate.total, 4)
})

test('состав линейки и коллекции в карточке', () => {
  const family = cardInfo(
    items.find((entry) => entry.id === -2),
    items,
  )
  assert.equal(family.kind, 'Линейка')
  assert.deepEqual(family.includes, {
    names: ['АРБАТ', 'КРИСТАЛЛ'],
    total: 2,
  })
  const aec = cardInfo(
    items.find((entry) => entry.id === 5),
    items,
  )
  assert.equal(aec.includes?.names[0], 'Revit')
  assert.ok((aec.includes?.total ?? 0) > 10)
})

test('коллекция на странице товара ведёт на программы с своей страницей', () => {
  const bundle = collectionContents('Architecture Engineering & Construction Collection', items)
  assert.equal(bundle?.contents.find((entry) => entry.name === 'Revit')?.href, '/catalog/x/6/')
  assert.equal(bundle?.contents.find((entry) => entry.name === 'Civil 3D')?.href, null)
  assert.equal(collectionContents('Revit', items), null)
})

test('популярные решения: товар своей карточкой, подборка — с числом позиций', () => {
  const entries = popularEntries(
    [
      { key: 'a', title: 'Revit', href: '/catalog/x/6/', picture: null },
      {
        key: 'b',
        title: 'Плоттеры Canon',
        href: '/catalog?group=hardware&type=plotters',
        picture: null,
      },
      { key: 'c', title: 'Нет такого', href: '/search?q=Нет такого', picture: null },
    ],
    items,
    facets,
  )
  assert.equal(entries.length, 2)
  assert.equal(entries[0]?.item.id, 6)
  assert.equal(entries[0]?.note, null)
  assert.equal(entries[1]?.info.kind, 'Подборка')
  assert.equal(entries[1]?.note, '1 позиция')
})
