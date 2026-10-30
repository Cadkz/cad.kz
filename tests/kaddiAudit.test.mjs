// Пакет 4 аудита 21.10.2026 «Кадди»: одна цена с сайтом, связь в один шаг, продление с программой.
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  ASSISTANT_GREETING,
  hasPrice,
  managerFormReply,
  renewCard,
  renewProgram,
  wantsManager,
} from '../src/domain/assistant.mjs'
import { sumPriceRows } from '../src/domain/priceTable.mjs'
import { SITE_REQUEST_NOTE, siteBlocksPrice, siteEntryFor } from '../src/domain/sitePrice.mjs'

const site = [
  { title: 'AutoCAD', priceFrom: '313 621 ₸', variant: false },
  { title: 'AutoCAD', priceFrom: null, variant: true },
  { title: 'AutoCAD LT', priceFrom: '313 621 ₸', variant: true },
  { title: 'AutoCAD Revit LT Suite', priceFrom: null, variant: true },
  { title: 'SCAD Office', priceFrom: '1 200 000 ₸', variant: false },
  { title: 'ABC', priceFrom: null, variant: false },
]

const row = (family, name, edition = '') => ({ family, name, edition })

test('строка прайса → товар сайта: самое длинное название, вариант точнее карточки', () => {
  assert.equal(siteEntryFor(row('Autodesk AutoCAD', 'AutoCAD 2027'), site)?.priceFrom, null)
  assert.equal(siteEntryFor(row('AutoCAD', 'AutoCAD', 'LT'), site)?.title, 'AutoCAD LT')
  assert.equal(siteEntryFor(row('AutoCAD LT', 'AutoCAD LT 2027'), site)?.title, 'AutoCAD LT')
  assert.equal(
    siteEntryFor(row('AutoCAD Revit LT Suite', 'AutoCAD Revit LT Suite'), site)?.title,
    'AutoCAD Revit LT Suite',
  )
  assert.equal(siteEntryFor(row('SCAD Office', 'SCAD Office S392'), site)?.title, 'SCAD Office')
  // Слово «autocadlt» слитно не начинается со слова «autocad»; короткое «ABC» не сравнивается.
  assert.equal(siteEntryFor(row('Autocadlt', 'Autocadlt'), site), null)
  assert.equal(siteEntryFor(row('ABC', 'ABC ПИР'), site), null)
  assert.equal(siteEntryFor(row('GEO5', 'GEO5 Свая'), site), null)
})

test('на сайте «по запросу» — Кадди число не называет (К7)', () => {
  assert.equal(siteBlocksPrice(row('AutoCAD', 'AutoCAD 2027'), site), SITE_REQUEST_NOTE)
  assert.equal(siteBlocksPrice(row('AutoCAD', 'AutoCAD LT'), site), null)
  assert.equal(siteBlocksPrice(row('GEO5', 'GEO5 Свая'), site), null)
  assert.equal(siteBlocksPrice(row('AutoCAD', 'AutoCAD 2027'), []), null)
})

test('сумма заказа не складывает позицию «по запросу» на сайте', () => {
  const base = {
    article: '',
    fullName: '',
    purchase: 'Новая лицензия',
    term: 12,
    license: '',
    seats: 1,
    status: 'price',
    delivery: '',
    updated: '',
  }
  const rows = [
    { ...base, code: 'A1', family: 'AutoCAD', name: 'AutoCAD', edition: '', tiyn: '108926200' },
    { ...base, code: 'L1', family: 'AutoCAD', name: 'AutoCAD LT', edition: '', tiyn: '31362100' },
  ]
  const items = [
    { code: 'A1', quantity: 1 },
    { code: 'L1', quantity: 2 },
  ]
  const result = sumPriceRows(rows, items, 'included', (r) => siteBlocksPrice(r, site))
  assert.equal(result.total, null)
  // Суммы — с неразрывным пробелом между разрядами.
  const plain = (/** @type {unknown} */ v) => String(v).replace(/\s/g, ' ')
  assert.equal(plain(result.totalWithoutExcluded), '626 000 ₸')
  assert.deepEqual(
    result.excluded.map((e) => [e.code, e.reason]),
    [['A1', SITE_REQUEST_NOTE]],
  )
  // Без сверки с сайтом — как раньше.
  assert.equal(plain(sumPriceRows(rows, items, 'included').total), '1 715 000 ₸')
})

test('просьба о связи — сразу форма (Ка3), жалоба и возврат — нет', () => {
  for (const text of [
    'Позвоните мне',
    'Перезвоните пожалуйста',
    'Свяжите меня с менеджером',
    'Связаться с менеджером',
    'Хочу поговорить с человеком',
    'Нужен менеджер',
    'Наберите меня, 87011234567',
    'Пусть менеджер мне позвонит',
    'Хочу обратный звонок',
  ])
    assert.equal(wantsManager(text), true, text)
  for (const text of [
    'Менеджер не отвечает, хочу пожаловаться',
    'Хочу вернуть деньги, свяжите с менеджером',
    'Связь SCAD с Revit есть?',
    'Нужен человек, который знает Revit, есть курсы?',
    'Сколько стоит AutoCAD?',
    'Позвонил вчера, никто не взял трубку — а цена AutoCAD сейчас какая на три года для компании?',
  ])
    assert.equal(wantsManager(text), false, text)
  assert.match(managerFormReply('work'), /в форме — менеджер свяжется с вами в рабочее время/)
  assert.match(managerFormReply('off'), /в ближайшее рабочее время/)
})

test('цена в ответе — кнопка «Прислать расчёт» (Ка4); новое приветствие (Т18)', () => {
  assert.equal(hasPrice('AutoCAD LT, новая лицензия на 1 год — 313 621 ₸ за 1 место.'), true)
  assert.equal(hasPrice('Стоимость предоставляется по запросу.'), false)
  assert.match(ASSISTANT_GREETING, /^Здравствуйте! Я Кадди, консультант CAD\.kz/)
})

test('продление с выбранной программой (Ка5)', () => {
  assert.equal(renewProgram(['Нужно продлить Revit']), 'Revit')
  assert.equal(renewProgram(['продлить автокад лт на год']), 'AutoCAD LT')
  assert.equal(renewProgram(['Хочу продлить АВС']), 'АВС-KZ')
  assert.equal(renewProgram(['продлить GEO 5 и ревит']), 'GEO5')
  // Последний вопрос без программы — берётся из прежних.
  assert.equal(renewProgram(['Продлить лицензию', 'Скад офис у нас']), 'SCAD Office')
  assert.equal(renewProgram(['Продлить лицензию LT']), null)
  assert.deepEqual(renewCard('SCAD Office'), {
    id: 0,
    title: 'Заявка на продление SCAD Office',
    href: '/renew?program=SCAD%20Office',
    vendor: null,
    price: null,
    note: 'Форма на сайте, менеджер найдёт вашу лицензию',
  })
  assert.equal(renewCard(null).href, '/renew')
})
