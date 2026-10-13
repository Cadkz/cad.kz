import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  fieldLines,
  inlineSteps,
  looksLikeHeading,
  PARAGRAPH_LIMIT,
  splitParagraph,
} from '../src/domain/typography.mjs'

test('нумерованные шаги в строку → вступление и пункты', () => {
  const text =
    'Как купить 1. Выберите программу и нажмите «В корзину». 2. В корзине проверьте состав. 3. Укажите, кто покупает.'
  assert.deepEqual(inlineSteps(text), {
    intro: 'Как купить',
    items: [
      'Выберите программу и нажмите «В корзину».',
      'В корзине проверьте состав.',
      'Укажите, кто покупает.',
    ],
  })
})

test('числа не по порядку и одиночный номер — не шаги', () => {
  assert.equal(inlineSteps('Версия 2. Новая сборка вышла.'), null)
  assert.equal(inlineSteps('Наличными не более 1000 МРП. Цены с НДС.'), null)
})

test('длинный абзац делится по предложениям, части не длиннее предела', () => {
  const sentence = 'Менеджер свяжется с вами в рабочее время и уточнит детали заказа. '
  const text = sentence.repeat(14).trim()
  const parts = splitParagraph(text)
  assert.ok(parts.length > 1)
  for (const part of parts) assert.ok(part.length <= PARAGRAPH_LIMIT)
  assert.equal(parts.join(' '), text)
})

test('короткий абзац не делится, сокращения не рвут предложение', () => {
  assert.deepEqual(splitParagraph('Офис: г. Астана, ул. Пушкина.'), [
    'Офис: г. Астана, ул. Пушкина.',
  ])
})

test('реквизиты «подпись: значение» → таблица, строка без значения — группа', () => {
  assert.deepEqual(
    fieldLines(['**БИН**: 123456789012', 'КБЕ: 17', 'Банковские реквизиты:', 'ИИК: KZ00']),
    [
      { label: 'БИН', value: '123456789012' },
      { label: 'КБЕ', value: '17' },
      { label: 'Банковские реквизиты', value: '' },
      { label: 'ИИК', value: 'KZ00' },
    ],
  )
  assert.equal(fieldLines(['Обычный текст без подписей.', 'Ещё строка.']), null)
})

test('короткая строка без точки — подзаголовок', () => {
  assert.equal(looksLikeHeading('Оплата'), true)
  assert.equal(looksLikeHeading('Цены на сайте указаны с НДС.'), false)
})

test('одна строка «подпись: значение»', async () => {
  const { fieldLine } = await import('../src/domain/typography.mjs')
  assert.deepEqual(fieldLine('ИИК: KZ00'), { label: 'ИИК', value: 'KZ00' })
  assert.equal(fieldLine('Просто предложение без двоеточия.'), null)
})
