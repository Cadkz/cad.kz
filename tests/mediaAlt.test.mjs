import assert from 'node:assert/strict'
import test from 'node:test'
import { altFromFilename } from '../src/domain/mediaAlt.mjs'

test('описание картинки из имени файла', () => {
  assert.equal(altFromFilename('canon-tx-4300_front.jpg'), 'canon tx 4300 front')
  assert.equal(altFromFilename('C:\\Фото\\AutoCAD 2027.PNG'), 'AutoCAD 2027')
  assert.equal(altFromFilename('скриншот.webp'), 'скриншот')
  assert.equal(altFromFilename(''), 'Изображение')
  assert.equal(altFromFilename(null), 'Изображение')
})
