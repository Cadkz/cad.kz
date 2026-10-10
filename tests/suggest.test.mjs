import assert from 'node:assert/strict'
import test from 'node:test'
import { searchItems } from '../src/domain/search.mjs'
import { suggest } from '../src/domain/suggest.mjs'

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

test('SCAD: сначала программы, потом производитель, потом остальные программы', () => {
  assert.deepEqual(titles('scad'), [
    'SCAD Office',
    'SCAD++ Железобетон',
    'SCAD Soft',
    'Программы-сателлиты SCAD Office',
  ])
})

test('регистр, кириллица и опечатки', () => {
  assert.equal(titles('ревит')[0], 'Revit')
  assert.equal(titles('АВТОКАД')[0], 'AutoCAD')
  assert.equal(titles('скад')[0], 'SCAD Office')
})

test('не больше семи строк, остальное — флаг «ещё»', () => {
  const result = suggest(index, 'geo5')
  assert.equal(result.items.length, 7)
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
