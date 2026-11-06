import assert from 'node:assert/strict'
import { test } from 'node:test'
import { langAlternates } from '../src/i18n/locales.mjs'

test('hreflang: все языки и русский как x-default', () => {
  assert.deepEqual(langAlternates('/catalog/autodesk/autocad/', ['ru', 'kk', 'en']), {
    ru: '/catalog/autodesk/autocad/',
    kk: '/kk/catalog/autodesk/autocad/',
    en: '/en/catalog/autodesk/autocad/',
    'x-default': '/catalog/autodesk/autocad/',
  })
})

test('hreflang: непереведённый язык не попадает, главная — /kk без слеша', () => {
  assert.deepEqual(langAlternates('/', ['ru', 'en']), {
    ru: '/',
    en: '/en',
    'x-default': '/',
  })
})

test('hreflang: русский есть, даже если его не передали', () => {
  assert.deepEqual(langAlternates('/bim', ['kk']), {
    ru: '/bim',
    kk: '/kk/bim',
    'x-default': '/bim',
  })
})
