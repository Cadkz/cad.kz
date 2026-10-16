import assert from 'node:assert/strict'
import test from 'node:test'
import {
  canTellPrice,
  deliveryTerm,
  formatTiyn,
  indexPriceRows,
  parseDay,
  parseKnowledge,
  parsePrice,
  parsePriceTable,
  priceUnit,
  queryWords,
  searchPriceIndex,
  sumPriceRows,
  termText,
  totalItems,
  validateKnowledge,
  validatePriceRows,
  workTime,
} from '../src/domain/priceTable.mjs'

// Искусственный прайс в формате листа product_price_list (настоящий файл внутренний, в репозиторий не кладётся).
const HEADER = [
  'Код',
  'Артикул',
  'Семейство продукта',
  'Короткое название',
  'Полное наименование',
  'Тип покупки',
  'Срок, месяцев',
  'Редакция / комплектация',
  'Тип лицензии',
  'Количество мест',
  'Цена, тенге',
  'Статус цены',
  'Срок поставки',
  'Дата обновления',
]
const line = (code, family, name, purchase, term, edition, license, seats, price, status) => [
  code,
  `ART-${code}`,
  family,
  name,
  `${name} (полное наименование)`,
  purchase,
  term,
  edition,
  license,
  seats,
  price,
  status,
  '5-7 рабочих дней',
  '46294',
]
const SHEETS = [
  {
    name: 'FAQ',
    rows: [
      ['Ответы на часто задаваемые вопросы', 'Продукт'],
      ['AutoCAD LT — бюджетная версия без 3D', 'AutoCAD'],
      ['', ''],
      ['AutoCAD LT — бюджетная версия без 3D', 'AutoCAD'],
      ['График: пн–пт 9:00–18:00', ''],
    ],
  },
  {
    name: 'product_price_list',
    rows: [
      HEADER,
      line(
        '11-1',
        'Autodesk AutoCAD LT',
        'AutoCAD LT 2027 Annual',
        'Новая лицензия',
        '12',
        'LT; Коммерческая',
        'Именная (Single-user)',
        '1',
        '100,000.00',
        'Цена указана',
      ),
      line(
        '11-2',
        'Autodesk AutoCAD LT',
        'AutoCAD LT 2027 3-Year',
        'Новая лицензия',
        '36',
        'LT; Коммерческая',
        'Именная (Single-user)',
        '1',
        '300,000.00',
        'Цена указана',
      ),
      line(
        '11-3',
        'Autodesk AutoCAD LT',
        'AutoCAD LT Annual Renewal',
        'Продление',
        '12',
        'LT; Коммерческая',
        'Именная (Single-user)',
        '1',
        '90,000.00',
        'Цена указана',
      ),
      line(
        '11-4',
        'Autodesk AutoCAD',
        'AutoCAD including toolsets Annual',
        'Новая лицензия',
        '12',
        'Полная с наборами инструментов',
        'Именная (Single-user)',
        '1',
        '500,000.00',
        'Цена указана',
      ),
      line(
        '11-5',
        'Autodesk Revit',
        'Revit Annual',
        'Новая лицензия',
        '12',
        'Коммерческая',
        'Именная (Single-user)',
        '1',
        '',
        'По запросу',
      ),
      line(
        '11-6',
        'АВС',
        'АВС с привязкой к компьютеру',
        'Новая лицензия',
        '12',
        'Не указано',
        'Не указано',
        'Не указано',
        '200,000.00',
        'Цена указана',
      ),
      line(
        '11-7',
        'Плоттер Canon/TZ30000',
        'Плоттер Canon/TZ30000/36"',
        'Оборудование / расходные материалы',
        'Не указано',
        'Не указано',
        'Не указано',
        'Не указано',
        '',
        'По запросу',
      ),
      line(
        '11-8',
        'nanoCAD',
        'nanoCAD пакет 5 мест',
        'Новая лицензия',
        'Бессрочно',
        'Не указано',
        'Сетевая',
        '5',
        '1145337.6',
        'Цена указана',
      ),
      line(
        '11-9',
        'GEO5',
        'GEO5 Сваи',
        'Новая лицензия',
        'Не указано',
        'Не указано',
        'Не указано',
        'Не указано',
        '0',
        'Цена указана',
      ),
      line('11-1', 'дубль', 'Дубль кода', 'Новая лицензия', '12', '', '', '', '1', 'Цена указана'),
      ['', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ],
  },
]

test('цена из ячейки в тиынах: разделители, пусто и ноль — не цена', () => {
  assert.equal(parsePrice('12,500.00'), '1250000')
  assert.equal(parsePrice('12 500,00'), '1250000')
  assert.equal(parsePrice('1145337.6'), '114533760')
  assert.equal(parsePrice('12500'), '1250000')
  assert.equal(parsePrice('1.234.567'), '123456700')
  assert.equal(parsePrice(''), null)
  assert.equal(parsePrice('0'), null)
  assert.equal(parsePrice('по запросу'), null)
  assert.equal(parseDay('46294'), '2026-09-29')
  assert.equal(parseDay('29.09.2026'), '2026-09-29')
})

test('лист прайса и лист FAQ из книги: колонки по заголовкам, дубли и пустые цены', () => {
  const table = parsePriceTable(SHEETS)
  assert.ok(table)
  assert.equal(table.sheet, 'product_price_list')
  assert.equal(table.rows.length, 9)
  assert.equal(table.updated, '2026-09-29')
  assert.ok(table.problems.some((p) => /11-1 повторяется/.test(p)))
  assert.ok(table.problems.some((p) => /11-9 нет корректной цены/.test(p)))
  const [lt] = table.rows
  assert.deepEqual(lt, {
    code: '11-1',
    article: 'ART-11-1',
    family: 'Autodesk AutoCAD LT',
    name: 'AutoCAD LT 2027 Annual',
    fullName: 'AutoCAD LT 2027 Annual (полное наименование)',
    purchase: 'Новая лицензия',
    term: 12,
    edition: 'LT; Коммерческая',
    license: 'Именная (Single-user)',
    seats: 1,
    tiyn: '10000000',
    status: 'price',
    delivery: '5-7 рабочих дней',
    updated: '2026-09-29',
  })
  const abc = table.rows.find((r) => r.code === '11-6')
  assert.equal(abc?.edition, '')
  assert.equal(abc?.seats, null)
  assert.equal(table.rows.find((r) => r.code === '11-8')?.term, 'perpetual')
  assert.equal(table.rows.find((r) => r.code === '11-5')?.status, 'request')
  assert.equal(table.rows.find((r) => r.code === '11-9')?.status, 'invalid')

  const knowledge = parseKnowledge(SHEETS)
  assert.deepEqual(knowledge, {
    sheet: 'FAQ',
    entries: [
      { product: 'AutoCAD', text: 'AutoCAD LT — бюджетная версия без 3D' },
      { product: 'Все', text: 'График: пн–пт 9:00–18:00' },
    ],
  })
  assert.equal(parsePriceTable([{ name: 'x', rows: [['a', 'b']] }]), null)
})

test('строки из браузера проверяются заново', () => {
  const table = parsePriceTable(SHEETS)
  assert.ok(table)
  const rows = validatePriceRows(JSON.parse(JSON.stringify(table.rows)))
  assert.deepEqual(rows, table.rows)
  assert.equal(typeof validatePriceRows([]), 'string')
  assert.equal(typeof validatePriceRows([{ code: '1' }]), 'string')
  assert.equal(typeof validatePriceRows([...table.rows, table.rows[0]]), 'string')
  // Цена без статуса «price» не сохраняется, «price» без суммы — некорректная.
  const [fake] = /** @type {any[]} */ (validatePriceRows([{ ...table.rows[0], tiyn: 'abc' }]))
  assert.equal(fake.status, 'invalid')
  assert.equal(fake.tiyn, null)
  assert.equal(validateKnowledge([{ product: '', text: 'факт' }]).length, 1)
  assert.equal(typeof validateKnowledge([{ text: '' }]), 'string')
})

test('поиск: разговорные названия, все слова, фильтры, точный код', () => {
  const table = parsePriceTable(SHEETS)
  assert.ok(table)
  const index = indexPriceRows(table.rows)
  const codes = (filters) => searchPriceIndex(index, filters).rows.map((r) => r.code)
  assert.deepEqual(queryWords('Сколько стоит автокад на год'), [['autocad'], ['год']])
  assert.deepEqual(codes({ query: 'автокад лт', purchase: 'новая', term: 12 }), ['11-1'])
  assert.deepEqual(codes({ query: 'AutoCAD LT', purchase: 'продление' }), ['11-3'])
  assert.deepEqual(new Set(codes({ query: 'автокад' })), new Set(['11-1', '11-2', '11-3', '11-4']))
  assert.deepEqual(codes({ query: 'ART-11-4' }), ['11-4'])
  assert.deepEqual(codes({ query: 'nanocad', term: 'perpetual' }), ['11-8'])
  assert.deepEqual(codes({ query: 'abc' }), ['11-6'])
  assert.deepEqual(codes({ query: 'автокад скад' }), [])
  const limited = searchPriceIndex(index, { query: 'автокад' }, 2)
  assert.equal(limited.total, 4)
  assert.equal(limited.rows.length, 2)
})

test('фильтр редакции прощает опечатку прайса GEO5 «Persoanal»', () => {
  const row = (code, edition) => ({
    code,
    article: code,
    family: 'GEO5',
    fullName: `Geo 5, модуль Устойчивость откоса подписка на 1 год ${edition}`,
    shortName: 'GEO5 Устойчивость откоса',
    purchase: 'Новая лицензия',
    term: 12,
    edition,
    license: '',
    seats: '',
    tiyn: 100,
    status: 'price',
    delivery: '',
    vat: '',
    updated: '',
  })
  const index = indexPriceRows(
    /** @type {any[]} */ ([
      row('g-1', 'Business'),
      row('g-2', 'Persoanal'),
      row('g-3', 'Enterprise'),
    ]),
  )
  const codes = searchPriceIndex(index, { query: 'GEO5 откоса', edition: 'Personal' }).rows.map(
    (r) => r.code,
  )
  assert.deepEqual(codes, ['g-2'])
})

test('цену называет Кадди только для новой лицензии ПО с числовой ценой', () => {
  const table = parsePriceTable(SHEETS)
  assert.ok(table)
  const row = (code) => {
    const found = table.rows.find((r) => r.code === code)
    assert.ok(found)
    return found
  }
  assert.deepEqual(canTellPrice(row('11-1')), { ok: true })
  assert.match(canTellPrice(row('11-3')).ok ? '' : canTellPrice(row('11-3')).reason, /Продление/)
  assert.equal(canTellPrice(row('11-5')).ok, false)
  assert.equal(canTellPrice(row('11-7')).ok, false)
  assert.equal(canTellPrice(row('11-9')).ok, false)
  assert.equal(formatTiyn('10000000'), '100\u00a0000\u00a0₸')
  assert.equal(formatTiyn('114533760'), '1 145 337,60 ₸')
  assert.equal(priceUnit(row('11-1')), 'за 1 место')
  assert.equal(priceUnit(row('11-8')), 'за пакет на 5 мест')
  assert.equal(priceUnit(row('11-6')), 'за 1 лицензию')
  assert.equal(termText(12), 'на 1 год')
  assert.equal(termText(36), 'на 3 года')
  assert.equal(termText(null), 'срок в прайсе не указан')
  assert.equal(termText('perpetual'), 'бессрочная')
})

test('сроки поставки по условиям компании: AutoCAD, АВС, оборудование, остальное из прайса', () => {
  const table = parsePriceTable(SHEETS)
  assert.ok(table)
  const term = (code) => deliveryTerm(table.rows.find((r) => r.code === code) ?? table.rows[0])
  assert.equal(term('11-1'), 'до двух рабочих дней')
  assert.equal(term('11-4'), 'до двух рабочих дней')
  assert.equal(term('11-5'), '5-7 рабочих дней')
  assert.equal(term('11-6'), '5–7 рабочих дней')
  assert.equal(term('11-7'), 'уточняет менеджер')
})

test('рабочее время Астаны: будни 9–18, обед 13–14, выходные', () => {
  // Вторник 13.10.2026: 11:00, 13:30, 19:00 по Астане (UTC+5).
  assert.equal(workTime(new Date('2026-10-13T06:00:00Z')).state, 'work')
  assert.equal(workTime(new Date('2026-10-13T08:30:00Z')).state, 'lunch')
  assert.equal(workTime(new Date('2026-10-13T14:00:00Z')).state, 'off')
  assert.equal(workTime(new Date('2026-10-17T06:00:00Z')).state, 'off')
  assert.equal(
    workTime(new Date('2026-10-13T06:05:00Z')).text,
    'вторник, 13.10.2026, 11:05 по времени Астаны',
  )
})

test('сумма заказа: несколько товаров, количество, позиции без цены и пакеты', () => {
  const table = parsePriceTable(SHEETS)
  assert.ok(table)
  const sum = (items) => sumPriceRows(table.rows, items, 'included')
  // AutoCAD LT ×2 + АВС ×1: 2 × 100 000 + 200 000.
  const both = sum([
    { code: '11-1', quantity: 2 },
    { code: '11-6', quantity: 1 },
  ])
  assert.equal(both.total, '400\u00a0000\u00a0₸')
  assert.equal(both.vat, 'с НДС')
  assert.deepEqual(
    both.lines.map((l) => [l.code, l.sum]),
    [
      ['11-1', '200\u00a0000\u00a0₸'],
      ['11-6', '200\u00a0000\u00a0₸'],
    ],
  )
  assert.deepEqual(both.excluded, [])
  // Пакет одной штукой складывается точно, с тиынами; продление и «по запросу» — нет.
  const mixed = sum([
    { code: '11-8', quantity: 1 },
    { code: '11-4', quantity: 1 },
    { code: '11-3', quantity: 1 },
    { code: '11-5', quantity: 1 },
    { code: 'нет-такого', quantity: 1 },
  ])
  assert.equal(mixed.total, null)
  assert.equal(mixed.totalWithoutExcluded, '1\u00a0645\u00a0337,60\u00a0₸')
  assert.deepEqual(
    mixed.excluded.map((e) => e.code),
    ['11-3', '11-5', 'нет-такого'],
  )
  assert.match(mixed.note ?? '', /менеджер/)
  // Несколько пакетов мест — к менеджеру; нечего складывать — итога нет.
  const packs = sum([{ code: '11-8', quantity: 2 }])
  assert.equal(packs.total, null)
  assert.equal(packs.lines.length, 0)
  assert.match(packs.excluded[0]?.reason ?? '', /пакет/)
  // Ввод модели: список позиций, старый вид «код + количество», ошибки словами.
  assert.deepEqual(totalItems({ items: [{ code: ' 11-1 ', quantity: 3 }, { code: '11-6' }] }), [
    { code: '11-1', quantity: 3 },
    { code: '11-6', quantity: 1 },
  ])
  assert.deepEqual(totalItems({ code: '11-1', quantity: 2 }), [{ code: '11-1', quantity: 2 }])
  assert.equal(typeof totalItems({}), 'string')
  assert.equal(typeof totalItems({ items: [{ code: '11-1', quantity: 0 }] }), 'string')
  assert.equal(
    typeof totalItems({ items: Array(11).fill({ code: '11-1', quantity: 1 }) }),
    'string',
  )
})
