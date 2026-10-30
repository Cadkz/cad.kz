import assert from 'node:assert/strict'
import test from 'node:test'
import { NAME_FIXES, navisworksProperties } from '../src/domain/autodeskNamesSeed.mjs'
import { CARD_TEXTS } from '../src/domain/cardTexts.mjs'

const props = [
  { name: 'Артикул', value: '507S1' },
  { name: 'Общее — Программа', value: 'Navisworks' },
  { name: 'Система — Windows — ОС', value: 'Windows 11' },
  { name: 'Редакции — Проверка коллизий', value: 'Navisworks Manage' },
]

test('Navisworks: две редакции с понятной строкой про коллизии', () => {
  const manage = navisworksProperties(props, 'Manage')
  const simulate = navisworksProperties(props, 'Simulate')
  assert.ok(manage.some((p) => p.name === 'Артикул'))
  assert.ok(!simulate.some((p) => p.name === 'Артикул'))
  assert.ok(!manage.some((p) => p.name.startsWith('Редакции')))
  assert.equal(simulate.find((p) => p.name.endsWith('Программа'))?.value, 'Navisworks Simulate')
  assert.match(simulate.find((p) => p.name.endsWith('коллизий'))?.value ?? '', /^Нет/)
  // Повторный расчёт не дублирует строки.
  assert.deepEqual(navisworksProperties(manage, 'Manage'), manage)
  assert.ok(CARD_TEXTS.navisworks_simulate)
})

test('Fusion — официальные названия', () => {
  assert.equal(NAME_FIXES.fusion_for_design.title, 'Fusion for Design')
  assert.equal(NAME_FIXES.fusion_for_manufacturing.title, 'Fusion for Manufacturing')
})
