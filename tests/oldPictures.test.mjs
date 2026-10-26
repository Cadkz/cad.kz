import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isPng } from '../src/domain/isPng.mjs'

test('PNG определяется по типу файла, без типа — по расширению', () => {
  assert.equal(isPng({ mimeType: 'image/png', filename: 'leo.png' }), true)
  assert.equal(isPng({ mimeType: 'image/jpeg', filename: 'revit-2020-box.jpg' }), false)
  assert.equal(isPng({ mimeType: 'image/webp', filename: 'scan.webp' }), false)
  assert.equal(isPng({ mimeType: null, filename: 'Artec-Leo.PNG' }), true)
  assert.equal(isPng({ filename: 'old.gif' }), false)
})
