import assert from 'node:assert/strict'
import { test } from 'node:test'
import { pickStageKaddi } from '../src/domain/kaddiStage.mjs'

test('окно чата открыто — Кадди страницы не показывается', () => {
  assert.equal(pickStageKaddi({ chatOpen: true, current: 'a', visible: ['a', 'b'] }), null)
})

test('никого в экране — показывать некого, остаётся Кадди в углу', () => {
  assert.equal(pickStageKaddi({ chatOpen: false, current: 'a', visible: [] }), null)
})

test('несколько в экране — показывается верхний', () => {
  assert.equal(pickStageKaddi({ chatOpen: false, current: null, visible: ['a', 'b'] }), 'a')
})

test('уже показанный остаётся, пока он в экране, даже если выше появился другой', () => {
  assert.equal(pickStageKaddi({ chatOpen: false, current: 'b', visible: ['a', 'b'] }), 'b')
})

test('показанный ушёл из экрана — эстафету берёт следующий', () => {
  assert.equal(pickStageKaddi({ chatOpen: false, current: 'a', visible: ['b'] }), 'b')
})
