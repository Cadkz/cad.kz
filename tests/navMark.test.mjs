import assert from 'node:assert/strict'
import { test } from 'node:test'
import { activeLinkIndex, markMotion } from '../src/domain/navMark.mjs'

const links = [
  { href: '/renew' },
  { href: '/catalog?group=service&type=training' },
  { href: '/bim' },
  { href: '/news?kind=promotion' },
  { href: '/news', also: ['/articles'] },
]

test('пункт второй строки по адресу страницы', () => {
  assert.equal(activeLinkIndex(links, '/renew', ''), 0)
  assert.equal(activeLinkIndex(links, '/bim/', ''), 2)
  assert.equal(activeLinkIndex(links, '/news', ''), 4)
  assert.equal(activeLinkIndex(links, '/articles', ''), 4)
  assert.equal(activeLinkIndex(links, '/news', '?kind=promotion'), 3)
  assert.equal(activeLinkIndex(links, '/catalog', '?group=service&type=training&page=2'), 1)
  assert.equal(activeLinkIndex(links, '/catalog', '?group=software'), null)
  assert.equal(activeLinkIndex(links, '/', ''), null)
})

test('движение метки между пунктами', () => {
  assert.equal(markMotion(null, 2), 'enter')
  assert.equal(markMotion(2, null), 'leave')
  assert.equal(markMotion(null, null), 'still')
  assert.equal(markMotion(1, 1), 'still')
  assert.equal(markMotion(1, 3), 'right')
  assert.equal(markMotion(3, 0), 'left')
})
