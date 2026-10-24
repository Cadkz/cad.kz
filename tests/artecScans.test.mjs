import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { test } from 'node:test'
import { defaultScanIds, SCAN_OPTIONS, scanById } from '../src/domain/artecScans.mjs'

test('у каждого скана из библиотеки есть модель и превью', () => {
  for (const { value } of SCAN_OPTIONS) {
    const scan = scanById(value)
    assert.ok(scan, value)
    assert.ok(existsSync(`public${scan.src}`), scan.src)
    assert.ok(existsSync(`public${scan.poster}`), scan.poster)
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
