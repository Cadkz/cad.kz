import assert from 'node:assert/strict'
import test from 'node:test'
import { buildCatalog } from '../src/domain/bitrixCatalog.mjs'
import { detectKind, parseCsv, parseExcelHtml } from '../src/domain/bitrixFiles.mjs'
import { parseBitrixPrice, parseVatRate, priceProblem } from '../src/domain/bitrixPrice.mjs'
import { renderReport } from '../src/domain/bitrixReport.mjs'
import { quote } from '../src/domain/pricing.mjs'

test('CSV: BOM, кавычки, перенос строки внутри значения, CRLF', () => {
  const { columns, records } = parseCsv('﻿A;B\r\n1;"два ""в"" кавычках\nстрока"\r\n3;\n')
  assert.deepEqual(columns, ['A', 'B'])
  assert.deepEqual(records, [
    { A: '1', B: 'два "в" кавычках\nстрока' },
    { A: '3', B: '' },
  ])
})

test('Excel из админки: HTML-таблица с сущностями', () => {
  const html =
    '<table><tr><td>ID</td><td>Розничная цена</td></tr><tr><td>7</td><td>&euro;1,150.00&nbsp;</td></tr></table>'
  const { columns, records } = parseExcelHtml(html)
  assert.equal(detectKind(columns), 'productPrices')
  assert.equal(records[0]['Розничная цена'], '€1,150.00')
})

test('тип файла по заголовкам', () => {
  assert.equal(detectKind(['IE_ID', 'IP_PROP31']), 'offersCsv')
  assert.equal(detectKind(['IE_ID', 'IC_GROUP0']), 'productsCsv')
  assert.equal(detectKind(['ID', 'Розничная цена', 'Элемент каталога']), 'offerPrices')
  assert.equal(detectKind(['Что-то']), null)
})

test('цены во всех форматах Битрикса', () => {
  assert.deepEqual(parseBitrixPrice('257 950.00 руб.'), { amount: '257950', currency: 'RUB' })
  assert.deepEqual(parseBitrixPrice('1 542 800,00 тг.'), { amount: '1542800', currency: 'KZT' })
  assert.deepEqual(parseBitrixPrice('€7,100.00'), { amount: '7100', currency: 'EUR' })
  assert.deepEqual(parseBitrixPrice('$1,743.50'), { amount: '1743.50', currency: 'USD' })
  assert.deepEqual(parseBitrixPrice('от 45 540.00 руб.'), { amount: '45540', currency: 'RUB' })
  assert.equal(parseBitrixPrice(''), null)
  assert.deepEqual(parseBitrixPrice('договорная'), { error: 'договорная' })
})

test('нулевая цена и заглушка не продаются', () => {
  assert.equal(priceProblem(parseBitrixPrice('0,00 тг.')), 'zero')
  assert.equal(priceProblem(parseBitrixPrice('6 000 000 000,00 тг.')), 'suspicious')
  assert.equal(priceProblem(parseBitrixPrice('0.50 руб.')), null)
  assert.equal(parseVatRate('НДС 16% (по умолчанию)'), '16')
  assert.equal(parseVatRate('Без НДС'), '0')
  assert.equal(parseVatRate(''), '16')
})

test('цена старого сайта воспроизводится серверным расчётом (курс 6, НДС сверху)', () => {
  // На cad.kz 118 140 руб. показаны как 822 255 тг: тенге округляются вверх, как и у нас.
  assert.equal(quote({ amount: '118140', rate: '6' }).unitKzt, '822255')
  assert.equal(quote({ amount: '7100', rate: '550' }).unitKzt, '4529800')
})

const product = (id, extra = {}) => ({
  IE_ID: id,
  IE_NAME: `Товар ${id}`,
  IE_ACTIVE: 'Y',
  IE_CODE: `tovar_${id}`,
  IC_GROUP0: 'Программное обеспечение',
  IC_GROUP1: 'Csoft Development',
  IP_PROP10: 'Csoft Development',
  ...extra,
})
const offer = (id, productId, extra = {}) => ({
  IE_ID: id,
  IE_NAME: `Предложение ${id}`,
  IE_ACTIVE: 'Y',
  IP_PROP31: productId,
  IP_PROP82: `SKU-${id}`,
  ...extra,
})
const priced = (id, price, extra = {}) => ({
  ID: id,
  'Розничная цена': price,
  'НДС включен в цену': 'Нет',
  'Ставка НДС': 'НДС 16%',
  'Вид лицензии': 'локальная лицензия',
  'Срок действия': 'на 1 год',
  ...extra,
})

test('каталог: склейка строк, выключенные, сироты, повторы, простые товары', () => {
  const result = buildCatalog({
    productsCsv: [
      product('1', { IE_PREVIEW_PICTURE: '/upload/a.jpg', IP_PROP13: '/upload/b.jpg' }),
      product('1', { IP_PROP13: '/upload/c.jpg', IP_PROP10: 'csoft development' }),
      product('2', { IE_ACTIVE: 'N' }),
      product('3', {
        IC_GROUP0: 'Аппаратное обеспечение',
        IC_GROUP1: 'Плоттеры Canon plotWAVE',
        IP_PROP10: '',
      }),
      product('4', { IC_GROUP0: 'Услуги', IC_GROUP1: 'Курсы Revit и BIM', IP_PROP10: '' }),
    ],
    offersCsv: [
      offer('10', '1', { IP_PROP82: 'SKU-A' }),
      offer('11', '1', { IP_PROP82: 'SKU-A' }),
      offer('12', '1', { IP_PROP82: 'SKU-B' }),
      offer('13', '1', { IP_PROP82: 'SKU-C' }),
      offer('20', '2'),
      offer('30', '99'),
      offer('31', '1', { IE_ACTIVE: 'N' }),
    ],
    offerPrices: [
      priced('10', '100.00 руб.'),
      priced('11', ''),
      priced('12', '€300.00', { 'Срок действия': 'бессрочная' }),
      priced('13', '€300.00', { 'Срок действия': 'бессрочная' }),
    ],
    productPrices: [
      { ID: '3', 'Розничная цена': '6 000 000 000,00 тг.', 'НДС включен в цену': 'Да' },
      { ID: '4', 'Розничная цена': '500 000,00 тг.', 'НДС включен в цену': 'Да' },
    ],
  })
  const types = result.issues.map((i) => `${i.type}:${i.id}`).sort()
  assert.deepEqual(types, [
    'ambiguousVariant:12',
    'ambiguousVariant:13',
    'duplicateVariant:11',
    'offerOrphan:30',
    'offerProductInactive:20',
    'suspiciousPrice:3',
  ])
  const [first, plotter, course] = result.products
  assert.equal(result.products.length, 3)
  assert.deepEqual(first.images, ['/upload/a.jpg', '/upload/b.jpg', '/upload/c.jpg'])
  assert.equal(first.manufacturer, 'Csoft Development')
  assert.equal(plotter.kind, 'hardware')
  assert.equal(plotter.manufacturer, 'Canon')
  assert.equal(plotter.price, null)
  assert.equal(course.kind, 'course')
  assert.equal(course.manufacturer, null)
  assert.deepEqual(course.price, {
    amount: '500000',
    currency: 'KZT',
    includesVat: true,
    sourceVat: '16',
  })
  const kept = result.offers.find((o) => o.sku === 'SKU-A')
  assert.equal(kept.bitrixId, '10', 'из повторов остаётся предложение с ценой')
  assert.deepEqual(kept.price, {
    amount: '100',
    currency: 'RUB',
    includesVat: false,
    sourceVat: '16',
  })
  assert.equal(kept.license, 'локальная лицензия, на 1 год')
  assert.equal(result.offers.find((o) => o.sku === 'SKU-B').configuration, 'Предложение 12')
  assert.deepEqual(result.stats, {
    productsTotal: 4,
    productsActive: 3,
    offersTotal: 7,
    offersActive: 6,
  })
  assert.match(renderReport(result), /к переносу: 3/)
})
