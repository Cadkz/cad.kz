import assert from 'node:assert/strict'
import { test } from 'node:test'
import { NEWS_VENDORS, newsVendor, vendorWhere } from '../src/domain/newsVendors.mjs'

test('производители новостей: уникальные адреса и слова в нижнем регистре', () => {
  const slugs = NEWS_VENDORS.map((vendor) => vendor.slug)
  assert.equal(new Set(slugs).size, slugs.length)
  for (const vendor of NEWS_VENDORS)
    for (const word of vendor.words) assert.equal(word, word.toLowerCase())
})

test('условие отбора ищет слово в заголовке, анонсе и тексте', () => {
  const geo = newsVendor('geo5')
  assert.ok(geo)
  assert.equal(vendorWhere(geo).or.length, geo.words.length * 3)
  assert.equal(newsVendor('нет-такого'), null)
})
