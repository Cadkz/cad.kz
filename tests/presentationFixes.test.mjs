import assert from 'node:assert/strict'
import test from 'node:test'
import { fixPageBody, PURCHASE_TERMS, SCAD_RENAMES } from '../src/domain/presentationFixes.mjs'

test('страницы: опечатки исправлены, чужой текст не тронут', () => {
  assert.equal(
    fixPageBody('guaranty', 'документы, пожтверждающие покупку'),
    'документы, подтверждающие покупку',
  )
  assert.equal(fixPageBody('guaranty', 'свой текст маркетолога'), 'свой текст маркетолога')
  assert.equal(fixPageBody('delivery', 'документы, пожтверждающие'), 'документы, пожтверждающие')
  assert.match(fixPageBody('howto', 'наличными в офисе, не более 1000 МРП.'), /МРП/)
})

test('SCAD: название без версии, «сложных расчётов» больше нет', () => {
  assert.ok(SCAD_RENAMES.oldTitle.test('SCAD Office v. 25.1'))
  assert.ok(!SCAD_RENAMES.oldTitle.test('SCAD Office'))
  const labels = Object.values(SCAD_RENAMES.items).map((item) => item.label + item.note)
  assert.ok(labels.every((text) => !/сложн/i.test(text)))
})

test('условия покупки: у программ и оборудования по три пункта', () => {
  assert.equal(PURCHASE_TERMS.software.length, 3)
  assert.equal(PURCHASE_TERMS.hardware.length, 3)
  assert.match(PURCHASE_TERMS.hardware[0].text, /от 2 недель/)
})
