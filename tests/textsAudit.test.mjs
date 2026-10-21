import assert from 'node:assert/strict'
import { test } from 'node:test'
import { RENEW_PROGRAMS } from '../src/domain/siteRequest.mjs'
import { MACHINE_SUMMARY_FIX, RENEW_LABEL_FIX, replaceIfOld } from '../src/domain/textsAudit.mjs'

test('тексты из базы меняются, только если там прежний текст', () => {
  assert.equal(replaceIfOld('Продлить подписку', RENEW_LABEL_FIX), 'Продлить лицензию')
  assert.equal(replaceIfOld('Обновить версию', RENEW_LABEL_FIX), null)
  assert.equal(replaceIfOld(null, MACHINE_SUMMARY_FIX), null)
  assert.match(replaceIfOld(` ${MACHINE_SUMMARY_FIX[0]} `, MACHINE_SUMMARY_FIX) ?? '', /^Inventor/)
})

test('в продлении АВС-KZ, а не АВС', () => {
  assert.ok(RENEW_PROGRAMS.includes('АВС-KZ'))
  assert.ok(!RENEW_PROGRAMS.includes('АВС'))
})
