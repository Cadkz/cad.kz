import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'
import research from '../src/domain/equipmentResearch.json' with { type: 'json' }
import { SITE_PHOTOS, sitePhotos } from '../src/domain/sitePhotos.mjs'
import texts from '../src/domain/widetekTexts.json' with { type: 'json' }

/** Размеры WebP из заголовка: VP8X (с прозрачностью) или VP8 (без). */
function webpSize(file) {
  const head = readFileSync(file).subarray(0, 30)
  const chunk = head.toString('ascii', 12, 16)
  if (chunk === 'VP8X') return [head.readUIntLE(24, 3) + 1, head.readUIntLE(27, 3) + 1]
  assert.equal(chunk, 'VP8 ')
  return [head.readUInt16LE(26) & 0x3fff, head.readUInt16LE(28) & 0x3fff]
}

const slugs = new Set(research.products.map((entry) => entry.slug))

test('фото файлами сайта: файлы на месте, товары существуют, размеры заданы', () => {
  for (const [slug, photos] of Object.entries(SITE_PHOTOS)) {
    assert.ok(slugs.has(slug), `нет товара ${slug}`)
    assert.ok(photos.length > 0)
    for (const photo of photos) {
      assert.ok(existsSync(`public${photo.url}`), `нет файла ${photo.url}`)
      assert.ok(photo.width > 0 && photo.width <= 1600 && photo.height <= 1600)
      assert.deepEqual(webpSize(`public${photo.url}`), [photo.width, photo.height])
    }
  }
  assert.deepEqual(sitePhotos('нет-такого'), [])
})

test('тексты WideTEK: все 11 товаров, без оговорок исследователя', () => {
  assert.equal(texts.length, 11)
  for (const entry of texts) {
    assert.ok(slugs.has(entry.slug), `нет товара ${entry.slug}`)
    assert.ok(sitePhotos(entry.slug).length === 3, `нет фото у ${entry.slug}`)
    assert.ok(entry.summary.length > 20)
    assert.ok(entry.specs.length >= 10)
    assert.doesNotMatch(entry.description, /паспорт|брошюр/i)
  }
})
