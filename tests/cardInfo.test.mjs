import assert from 'node:assert/strict'
import test from 'node:test'
import { cardInfo, ownCardText, summaryPhrase } from '../src/domain/cardTexts.mjs'

const fallback = 'Программа SCAD Soft'

test('название до тире, пояснение — фраза карточки', () => {
  assert.deepEqual(
    cardInfo({ title: 'АРБАТ - экспертиза и расчёт элементов', summary: null, fallback }),
    { title: 'АРБАТ', text: 'Экспертиза и расчёт элементов' },
  )
  assert.deepEqual(cardInfo({ title: 'САПФИР 3D', own: 'Своя фраза', fallback }), {
    title: 'САПФИР 3D',
    text: 'Своя фраза',
  })
})

test('длинное описание — законченная фраза без «…»', () => {
  const text = summaryPhrase(
    'САПФИР 3D — инструменты построения и редактирования 3D модели, создание чертежей из 3D модели, оформление документации по ГОСТ и СП. Второе предложение.',
    'САПФИР 3D',
  )
  assert.equal(
    text,
    'Инструменты построения и редактирования 3D модели, создание чертежей из 3D модели',
  )
  assert.ok(!text?.includes('…'))
  assert.equal(summaryPhrase('Короткое описание.', 'X'), 'Короткое описание')
})

test('нет ни описания, ни пояснения — запасная фраза', () => {
  assert.deepEqual(cardInfo({ title: 'ВЕСТ', summary: null, fallback }), {
    title: 'ВЕСТ',
    text: fallback,
  })
  assert.equal(ownCardText(null), null)
})
