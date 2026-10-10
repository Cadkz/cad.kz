import assert from 'node:assert/strict'
import { test } from 'node:test'
import { applyPairs, isDraftByVersion, OFFER_FIXES } from '../src/domain/versionsSeed.mjs'

test('замена версий по порядку и без падения на пустом', () => {
  const pairs = [
    ['2025.x', '2027.x'],
    ['2026.x', '2027.x'],
  ]
  assert.equal(
    applyPairs('ПК GeoniCS (2026.x, локальная лицензия (1 год))', pairs),
    'ПК GeoniCS (2027.x, локальная лицензия (1 год))',
  )
  assert.equal(applyPairs(null, pairs), null)
  assert.equal(applyPairs('', pairs), '')
})

test('АВС: год убран из комплектации СРД', () => {
  const fix = OFFER_FIXES.find((f) => f.slug === 'srd_2024_smetno_normativnaya_baza')
  assert.equal(
    applyPairs('СРД-2024 сметно нормативная база', fix?.pairs ?? []),
    'СРД сметно-нормативная база',
  )
})

test('в черновики только старые V-Ray, Phoenix, GisEngine, подшипники', () => {
  const chaos = (title) => isDraftByVersion({ title, vendor: 'Chaos Group' })
  assert.ok(chaos('V-Ray 3.0 Workstation for MODO, коммерческий, английский'))
  assert.ok(chaos('V-Ray Next для Rhino, для студентов/преподавателей, на 1 год, английский'))
  assert.ok(
    chaos(
      'Право на использование программного обеспечения V-Ray 5 для 3ds Max - Annual (12 месяцев)',
    ),
  )
  assert.ok(chaos('Phoenix FD 3.0 Simulation License, английский'))
  assert.ok(!chaos('V-Ray Cloud Credits, Pack 500, коммерческий, английский'))
  assert.ok(!chaos('V-Ray для Unreal, для студентов/преподавателей, на 1 год, английский'))
  assert.ok(
    !chaos(
      'Право на использование программного обеспечения V-Ray для Cinema 4D Workstation Annual License',
    ),
  )
  assert.ok(
    isDraftByVersion({
      title: 'Право на использование программного обеспечения CS GisEngine (1.1 Viewer)',
      vendor: 'Csoft Development',
    }),
  )
  assert.ok(
    isDraftByVersion({
      title: 'Подшипники качения. Электронный справочник V5.0, лицензия 3,5',
      vendor: 'АСКОН',
    }),
  )
  assert.ok(!isDraftByVersion({ title: 'AutomatiCS 2011', vendor: 'Csoft Development' }))
  assert.ok(!isDraftByVersion({ title: 'Phoenix FD 3.0', vendor: 'АСКОН' }))
})
