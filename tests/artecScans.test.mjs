import assert from 'node:assert/strict'
import { test } from 'node:test'
import { defaultScanIds, SCAN_OPTIONS, scanById } from '../src/domain/artecScans.mjs'

test('у каждого скана из библиотеки есть плеер Sketchfab и адрес превью', () => {
  for (const { value } of SCAN_OPTIONS) {
    const scan = scanById(value)
    assert.ok(scan, value)
    assert.match(scan.embed, /^https:\/\/sketchfab\.com\/models\/[0-9a-f]{32}\/embed\?/, scan.embed)
    assert.equal(scan.poster, `/scan-posters/${value}.webp`)
  }
})

test('сканы по умолчанию: у каждого сканера свои, у прочих товаров нет', () => {
  for (const slug of [
    'artec_leo',
    'artec_eva',
    'artec_spider_ii',
    'artec_micro_ii',
    'artec_point_ii',
    'artec_ray_ii',
  ])
    assert.ok(defaultScanIds(slug).length >= 2, slug)
  assert.deepEqual(defaultScanIds('imageprograf_tx_4200'), [])
  assert.equal(scanById('нет такого'), null)
})
