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
      name: 'quote',
      input: { offerId: 5, quantity: 3 },
      result: { unit: '120 000 ₸', total: '360 000 ₸' },
    },
  ]
  assert.deepEqual(checkReply('Одно место — 120 000 ₸, за три — 360 000 ₸.', trace), [])
  const flags = checkReply('За три места выйдет 350 000 ₸.', trace)
  assert.equal(flags.length, 1)
  assert.match(flags[0].text, /Цена не из инструментов: 350\s000 ₸/)
})

test('флаги руководства: род, сроки, нормы, заявка, эмодзи, разметка', () => {
  const texts = (reply) =>
    checkReply(reply, [])
      .map((f) => f.text)
      .join(' | ')
  assert.match(texts('Я нашла для вас SCAD Office.'), /без рода/)
  assert.doesNotMatch(texts('Нашлось два варианта: SCAD Office и ЛИРА-FEM.'), /без рода/)
  assert.match(texts('Поставим лицензию за 2 дня.'), /срок поставки/)
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
      name: 'quote',
      input: { offerId: 5, quantity: 1 },
      result: { unit: '1 ₸', total: '1 ₸' },
    }),
    'quote(5, 1) → 1 ₸ за ед., итого 1 ₸',
  )
  assert.equal(
    describeCall({ name: 'getOffers', input: { productId: 3 }, result: { error: 'Нужен ID' } }),
    'getOffers(3) → ошибка: Нужен ID',
  )
})
