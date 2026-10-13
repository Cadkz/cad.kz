import assert from 'node:assert/strict'
import test from 'node:test'
import {
  CHECK_LIMIT,
  CHECK_QUESTIONS,
  checkReply,
  describeCall,
  parseQuestions,
  pricesIn,
} from '../src/domain/assistantCheck.mjs'

test('вопросы из поля: по строке, без пустых и повторов, не больше лимита', () => {
  assert.deepEqual(parseQuestions(' Нужен AutoCAD \n\n  \nНужен AutoCAD\nПлоттер А0'), [
    'Нужен AutoCAD',
    'Плоттер А0',
  ])
  assert.equal(
    parseQuestions(Array.from({ length: 60 }, (_, i) => `в${i}`).join('\n')).length,
    CHECK_LIMIT,
  )
  assert.deepEqual(parseQuestions(null), [])
  assert.ok(CHECK_QUESTIONS.length >= 20 && CHECK_QUESTIONS.length <= CHECK_LIMIT)
})

test('суммы в тенге: пробелы и неразрывные пробелы внутри числа', () => {
  assert.deepEqual(pricesIn('от 1 145 338 ₸, итого 2 290 676 тенге и 500 тг.'), [
    '1145338',
    '2290676',
    '500',
  ])
  assert.deepEqual(pricesIn('на 3 рабочих места'), [])
})

test('цена в ответе должна быть из инструментов', () => {
  const trace = [
    {
      name: 'priceTotal',
      input: { code: '11-1', quantity: 3 },
      result: { unitPrice: '120\u00a0000\u00a0₸', quantity: 3, total: '360\u00a0000\u00a0₸' },
    },
  ]
  assert.deepEqual(checkReply('Одно место — 120 000 ₸, за три — 360 000 ₸.', trace), [])
  const flags = checkReply('За три места выйдет 350 000 ₸.', trace)
  assert.equal(flags.length, 1)
  assert.match(flags[0].text, /Цена не из инструментов: 350\s000 ₸/)
})

test('флаги правил: род, сроки, нормы, заявка, «передал», эмодзи, разметка, длина', () => {
  const texts = (reply, trace = []) =>
    checkReply(reply, trace)
      .map((f) => f.text)
      .join(' | ')
  assert.match(texts('Я нашла для вас SCAD Office.'), /женском роде/)
  assert.doesNotMatch(texts('Проверил прайс. Подготовил два варианта.'), /роде/)
  assert.match(texts('Поставим лицензию за 2 дня.'), /срок поставки без прайса/)
  const priced = [{ name: 'getPrice', input: {}, result: { delivery: 'до двух рабочих дней' } }]
  assert.doesNotMatch(texts('Поставка — до двух рабочих дней.', priced), /срок/)
  assert.match(texts('Я передал ваш запрос менеджеру.'), /после подтверждённой передачи/)
  assert.doesNotMatch(texts('Передам ваш запрос менеджеру.'), /подтверждённой/)
  assert.match(texts('Подскажите ИИН и адрес проживания.'), /ИИН/)
  assert.match(texts('Спасибо за вопрос.'), /Благодарит/)
  const long = 'Это очень длинный ответ. '.repeat(8)
  assert.match(texts(long), /Длинно для мессенджера/)
  assert.doesNotMatch(texts('Вам нужен полный AutoCAD или AutoCAD LT?'), /Длинно/)
  assert.match(texts('Программа соответствует нормам СП РК.'), /нормам/)
  assert.match(texts('Ваша заявка оформлена.'), /заявка оформлена/)
  assert.match(texts('Конечно! 😺'), /эмодзи/)
  assert.match(texts('**SCAD** — хороший выбор'), /Markdown/)
  assert.match(texts('Скидку назовёт менеджер.'), /Скидки/)
  assert.deepEqual(checkReply('   ', []), [{ level: 'warn', text: 'Пустой ответ' }])
})

test('обращение к инструменту словами', () => {
  assert.equal(
    describeCall({
      name: 'searchProducts',
      input: { query: 'металлоконструкции' },
      result: { products: [{ title: 'SCAD Office' }, { title: 'ЛИРА-FEM' }] },
    }),
    'searchProducts(металлоконструкции) → SCAD Office; ЛИРА-FEM',
  )
  assert.equal(
    describeCall({
      name: 'searchPriceList',
      input: { query: 'AutoCAD LT' },
      result: { total: 2, rows: [{ code: '11-1', name: 'AutoCAD LT 1 год' }] },
    }),
    'searchPriceList(AutoCAD LT) → в прайсе 2: 11-1 AutoCAD LT 1 год',
  )
  assert.equal(
    describeCall({
      name: 'getPrice',
      input: { code: '11-1' },
      result: { price: '111 111 ₸', unit: 'за 1 место', delivery: 'до двух рабочих дней' },
    }),
    'getPrice(11-1) → 111 111 ₸ за 1 место, поставка: до двух рабочих дней',
  )
  assert.equal(
    describeCall({
      name: 'getPrice',
      input: { code: '11-2' },
      result: { price: null, note: 'Цена по запросу — уточняет менеджер' },
    }),
    'getPrice(11-2) → без цены: Цена по запросу — уточняет менеджер',
  )
  assert.equal(
    describeCall({
      name: 'priceTotal',
      input: { code: '11-1', quantity: 3 },
      result: { unitPrice: '1 ₸', quantity: 3, total: '3 ₸' },
    }),
    'priceTotal(11-1, 3) → 1 ₸ × 3 = 3 ₸',
  )
  assert.equal(
    describeCall({ name: 'getOffers', input: { productId: 3 }, result: { error: 'Нужен ID' } }),
    'getOffers(3) → ошибка: Нужен ID',
  )
})
