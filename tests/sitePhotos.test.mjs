import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'
import { NEW_SCANNERS } from '../src/domain/artecNewScanners.mjs'
import artecSoftware from '../src/domain/artecSoftwareTexts.json' with { type: 'json' }
import research from '../src/domain/equipmentResearch.json' with { type: 'json' }
import legacy from '../src/domain/legacyCatalog.json' with { type: 'json' }
import { SITE_PHOTOS, sitePhotos } from '../src/domain/sitePhotos.mjs'
import software from '../src/domain/softwareTexts.json' with { type: 'json' }
import texts from '../src/domain/widetekTexts.json' with { type: 'json' }

/** Размеры WebP из заголовка: VP8X (с прозрачностью) или VP8 (без). */
function webpSize(file) {
  const head = readFileSync(file).subarray(0, 30)
  const chunk = head.toString('ascii', 12, 16)
  if (chunk === 'VP8X') return [head.readUIntLE(24, 3) + 1, head.readUIntLE(27, 3) + 1]
  assert.equal(chunk, 'VP8 ')
  return [head.readUInt16LE(26) & 0x3fff, head.readUInt16LE(28) & 0x3fff]
}

const slugs = new Set([
  ...research.products.map((entry) => entry.slug),
  ...NEW_SCANNERS.map((entry) => entry.slug),
  ...Object.keys(legacy.products),
])

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

test('пачка Artec: фото у 8 сканеров и 2 программ, тексты только у программ', () => {
  const scanners = [
    'artec_leo',
    'artec_eva',
    'artec_spider_ii',
    'artec_micro_ii',
    'artec_ray_ii',
    'artec_jet',
    'artec_point_ii',
    'artec_neo',
  ]
  for (const slug of scanners) {
    const photos = sitePhotos(slug)
    assert.ok(photos.length >= 3, `мало фото у ${slug}`)
    assert.match(photos[0]?.url ?? '', /^\/images\/equipment\/artec-/)
  }
  assert.deepEqual(
    artecSoftware.map((entry) => entry.slug),
    ['artec_studio_19', 'artec_cloud'],
  )
  for (const entry of artecSoftware) {
    assert.ok(slugs.has(entry.slug), `нет товара ${entry.slug}`)
    assert.ok(sitePhotos(entry.slug).length >= 2, `нет скриншотов у ${entry.slug}`)
    assert.ok(entry.summary.length > 20)
    assert.ok(entry.specs.length >= 10)
    assert.doesNotMatch(entry.description, /не задаётся|требует подтверждения/i)
  }
})

test('пачка программ: скриншоты у 12, тексты у 7 без утверждённых', () => {
  const shots = [
    'autocad',
    'autodesk-revit',
    'civil_3d',
    'inventor_professional',
    'navisworks',
    '3ds_max',
    'architecture_engineering_construction_collection-1107088405',
    'fusion_360_team',
    'the_software_package_avs_4',
    'scad_v23',
    'lira_sapr',
    'geo5',
  ]
  for (const slug of shots) {
    assert.match(sitePhotos(slug)[0]?.url ?? '', /^\/images\/software\//, `нет скриншота у ${slug}`)
  }
  // Утверждённые 23.10 тексты не трогаем.
  const approved = [
    'autocad',
    'autodesk-revit',
    'scad_v23',
    'lira_sapr',
    'fusion',
    'fusion_360_team',
    'geo5',
  ]
  assert.equal(software.length, 7)
  for (const entry of software) {
    assert.ok(slugs.has(entry.slug), `нет товара ${entry.slug}`)
    assert.ok(!approved.includes(entry.slug), `утверждённый текст: ${entry.slug}`)
    assert.ok(entry.summary.length > 20)
    assert.ok(entry.description.length > 1500)
    assert.ok(entry.specs.length >= 4)
    assert.doesNotMatch(entry.description, /карточк|не подтвержд|официальной странице/i)
  }
})
