import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { localizeHref, splitLangPath } from '../src/i18n/locales.mjs'
import { translate } from '../src/i18n/translate.mjs'

test('язык из адреса: приставка снимается, без неё — русский', () => {
  assert.deepEqual(splitLangPath('/kk/catalog'), { lang: 'kk', path: '/catalog' })
  assert.deepEqual(splitLangPath('/en'), { lang: 'en', path: '/' })
  assert.deepEqual(splitLangPath('/catalog'), { lang: 'ru', path: '/catalog' })
  // Похожее начало — не приставка.
  assert.deepEqual(splitLangPath('/kkm'), { lang: 'ru', path: '/kkm' })
})

test('адрес на языке: страницы получают приставку, служебное и внешнее — нет', () => {
  assert.equal(localizeHref('kk', '/catalog?group=software'), '/kk/catalog?group=software')
  assert.equal(localizeHref('en', '/'), '/en')
  assert.equal(localizeHref('en', '/#faq'), '/en#faq')
  assert.equal(localizeHref('ru', '/kk/catalog'), '/catalog')
  assert.equal(localizeHref('en', '/kk/catalog'), '/en/catalog')
  for (const same of [
    '/api/request',
    '/admin',
    '/images/a.png',
    '/products/x/specs.pdf',
    'https://wa.me/1',
    'tel:+7',
    '#top',
  ])
    assert.equal(localizeHref('kk', same), same, same)
})

test('перевод: нет в словаре — русский, подстановки работают', () => {
  assert.equal(translate({ Каталог: 'Catalog' }, 'Каталог'), 'Catalog')
  assert.equal(translate(null, 'Каталог'), 'Каталог')
  assert.equal(translate({}, 'Корзина, товаров: {count}', { count: 2 }), 'Корзина, товаров: 2')
})

test('словари казахского и английского: одинаковые ключи, подстановки сохранены', () => {
  const read = (lang) =>
    JSON.parse(readFileSync(new URL(`../src/i18n/messages/${lang}.json`, import.meta.url), 'utf8'))
  const kk = read('kk')
  const en = read('en')
  assert.deepEqual(Object.keys(kk).sort(), Object.keys(en).sort())
  for (const dict of [kk, en])
    for (const [ru, text] of Object.entries(dict)) {
      assert.ok(text.trim(), ru)
      assert.deepEqual(text.match(/\{\w+\}/g) ?? [], ru.match(/\{\w+\}/g) ?? [], ru)
    }
})
