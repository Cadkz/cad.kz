import assert from 'node:assert/strict'
import { test } from 'node:test'
import { systemPrompt } from '../src/domain/assistant.mjs'
import { splitQuickReplies } from '../src/domain/quickReplies.mjs'

const question = 'Что именно считаете: сваи, осадку или устойчивость откоса?'

test('строка кнопок убирается из текста, варианты — отдельно', () => {
  assert.deepEqual(splitQuickReplies(`${question}\nКнопки: Сваи | Осадка | Откос`), {
    text: question,
    replies: ['Сваи', 'Осадка', 'Откос'],
  })
})

test('кавычки, точки, пустые строки после и «Варианты:» вместо «Кнопки:»', () => {
  const { text, replies } = splitQuickReplies(
    `${question}\n\nВарианты: «Только 2D» | 2D и 3D. | Сваи | сваи\n\n`,
  )
  assert.equal(text, question)
  assert.deepEqual(replies, ['Только 2D', '2D и 3D', 'Сваи'])
})

test('негодные варианты — строка убрана, кнопок нет', () => {
  const many = splitQuickReplies(`${question}\nКнопки: А1 | Б2 | В3 | Г4 | Д5`)
  assert.equal(many.text, question)
  assert.deepEqual(many.replies, [])
  const one = splitQuickReplies(`${question}\nКнопки: Сваи`)
  assert.deepEqual(one.replies, [])
  const long = splitQuickReplies(`${question}\nКнопки: Сваи | ${'очень '.repeat(10)}длинный`)
  assert.deepEqual(long.replies, [])
})

test('без строки кнопок и «кнопки» внутри текста — текст как есть', () => {
  const plain = 'Для обычных откосов подойдёт GEO5 Устойчивость откоса.'
  assert.deepEqual(splitQuickReplies(plain), { text: plain, replies: [] })
  const inside = 'Кнопки: Сваи | Осадка\nА это продолжение ответа.'
  assert.deepEqual(splitQuickReplies(inside), { text: inside, replies: [] })
})

test('ответ только из строки кнопок не превращается в пустой', () => {
  const only = 'Кнопки: Сваи | Осадка'
  assert.deepEqual(splitQuickReplies(only), { text: only, replies: [] })
})

test('правило кнопок есть в правилах Кадди', () => {
  const [stable] = systemPrompt({
    now: new Date(),
    knowledge: [],
    price: null,
    handoff: { state: 'none' },
    time: { state: 'work', text: '20.10.2026 15:00' },
  })
  assert.match(stable, /Кнопки: Сваи \| Осадка \| Откос/)
})
