import assert from 'node:assert/strict'
import test from 'node:test'
import { quote, siteTiyn } from '../src/domain/pricing.mjs'

test('net currency price and quantity', () => {
  const q = quote({ amount: '100', rate: '500', quantity: 2 })
  assert.equal(q.unitKzt, '58000')
  assert.equal(q.totalKzt, '116000')
  assert.equal(q.vatMinor, '1600000')
})
test('VAT included is not added twice', () =>
  assert.equal(quote({ amount: '116', rate: '500', includesVat: true }).unitKzt, '58000'))
test('different source and target rates', () =>
  assert.equal(
    quote({ amount: '120', rate: '1', includesVat: true, sourceVat: '20' }).unitKzt,
    '116',
  ))
test('unit price down to a thousand tenge (owner 30.10.2026), then multiply', () => {
  assert.equal(quote({ amount: '189990', rate: '1', targetVat: '0' }).unitKzt, '189000')
  assert.equal(
    quote({ amount: '189999.99', rate: '1', targetVat: '0', quantity: 2 }).totalKzt,
    '378000',
  )
  assert.equal(quote({ amount: '1000', rate: '1', targetVat: '0' }).unitKzt, '1000')
  assert.equal(quote({ amount: '999.5', rate: '1', targetVat: '0' }).unitKzt, '1000')
  assert.equal(quote({ amount: '1999', rate: '1', targetVat: '0' }).unitKzt, '1000')
})
test('Kaddi price rows: same rule in tiyn', () => {
  assert.equal(siteTiyn('18999000'), '18900000')
  assert.equal(siteTiyn('114533760'), '114500000')
  assert.equal(siteTiyn('85050'), '85100')
})
test('below a thousand: up to whole tenge, then multiply', () => {
  assert.equal(quote({ amount: '0.5', rate: '1', targetVat: '0', quantity: 3 }).totalKzt, '3')
  assert.equal(quote({ amount: '0.01', rate: '1', targetVat: '0', quantity: 3 }).totalKzt, '3')
  assert.equal(quote({ amount: '10', rate: '1', targetVat: '0' }).unitKzt, '10')
})
test('reject malformed prices, rates, quantities', () => {
  for (const bad of [
    { amount: '-1' },
    { rate: '0' },
    { quantity: 1.5 },
    { quantity: 1000 },
    { targetVat: '101' },
  ])
    assert.throws(() => quote({ amount: '100', rate: '500', ...bad }))
})
