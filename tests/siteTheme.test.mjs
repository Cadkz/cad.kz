import assert from 'node:assert/strict'
import test from 'node:test'
import { runInNewContext } from 'node:vm'
import { THEME_INIT_SCRIPT, THEME_STORAGE_KEY } from '../src/domain/siteTheme.mjs'

function firstPaint(saved, systemDark, blocked = false) {
  const document = { documentElement: { dataset: {} } }
  runInNewContext(THEME_INIT_SCRIPT, {
    document,
    localStorage: {
      getItem(key) {
        assert.equal(key, THEME_STORAGE_KEY)
        if (blocked) throw Error('denied')
        return saved
      },
    },
    matchMedia: () => ({ matches: systemDark }),
  })
  return document.documentElement.dataset.siteTheme
}
test('до первого кадра светлая тема по умолчанию даже на тёмном устройстве', () => {
  assert.equal(firstPaint(null, true), 'light')
  assert.equal(firstPaint(null, false), 'light')
  assert.equal(firstPaint('light', true), 'light')
  assert.equal(firstPaint('dark', false), 'dark')
})
test('запрет хранилища и неверное значение дают светлую тему', () => {
  assert.equal(firstPaint(null, true, true), 'light')
  assert.equal(firstPaint('invalid', false), 'light')
  assert.equal(firstPaint('invalid', true), 'light')
})
