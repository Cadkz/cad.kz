import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeCart } from '../src/domain/cart.mjs'

test('different configurations of the same product remain separate', () => {
  assert.equal(normalizeCart([{ offerId: 'geo-standard', quantity: 1 }, { offerId: 'geo-pro', quantity: 1 }]).length, 2)
})
test('identical configurations merge and client prices are discarded', () => {
  assert.deepEqual(normalizeCart([{ offerId: 'geo-pro', quantity: 2, totalKzt: '1' }, { offerId: 'geo-pro', quantity: 3 }]), [{ offerId: 'geo-pro', quantity: 5 }])
})
test('aggregate quantity cannot bypass limit with duplicate rows', () => {
  assert.throws(() => normalizeCart([{ offerId: 'geo-pro', quantity: 999 }, { offerId: 'geo-pro', quantity: 1 }]))
})
test('reject invalid cart shape and quantities', () => {
  for (const value of [null, {}, [null], [{ offerId: 'a', quantity: 0 }], [{ offerId: 'a', quantity: 1.1 }], Array(51).fill({ offerId: 'a', quantity: 1 })]) assert.throws(() => normalizeCart(value))
})
