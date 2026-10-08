// Общие заготовки для тестов заказа: каталог из двух предложений, курс EUR и хранилище в памяти.
// Цены считает настоящая функция quote из pricing.mjs, как и на сервере.

import { quote } from '../src/domain/pricing.mjs'

export const KEY = '3f2b8a52-6c1e-4d7b-9a40-0a1b2c3d4e5f'
export const NOW = new Date('2026-10-08T10:30:00.000Z')
// Рабочие БИН, проверены по контрольной цифре.
export const BIN = '971240001315'

export const buyerIndividual = {
  type: 'individual',
  name: 'Алия Нурланова',
  phone: '8 701 123-45-67',
  email: 'Aliya@Example.kz',
}

export function formRequest(overrides = {}) {
  return {
    idempotencyKey: KEY,
    items: [{ offerId: '11', quantity: 2 }],
    expectedTotalKzt: '5846400',
    buyer: { ...buyerIndividual },
    comment: '',
    consent: true,
    ...overrides,
  }
}

export class DuplicateError extends Error {}

/** GEO5: 4 200 € без НДС × 600 × 1,16 = 2 923 200 ₸ за единицу. Artec: 1 000 ₸ с НДС 16%. */
export function createWorld({ rate = '600' } = {}) {
  const world = {
    now: NOW,
    mode: 'demo',
    rates: { EUR: { value: rate, date: '2026-10-01T00:00:00.000Z' } },
    offers: new Map([
      [
        '11',
        {
          productId: 'geo5-stability',
          title: 'GEO5 Расчёт устойчивости',
          configuration: 'Стандарт',
          license: 'Бессрочная',
          amount: '4200',
          currency: 'EUR',
          includesVat: false,
          sourceVat: '16',
        },
      ],
      [
        '12',
        {
          productId: 'scanner-leo',
          title: 'Сканер Leo',
          configuration: 'Базовый',
          license: 'Постоянная',
          amount: '1000',
          currency: 'KZT',
          includesVat: true,
          sourceVat: '16',
        },
      ],
    ]),
    orders: [],
    outbox: [],
    recent: { phone: 0, client: 0 },
    saveCalls: 0,
  }

  world.deps = {
    mode: 'demo',
    now: () => world.now,
    randomIndex: () => 0,
    async priceCart(items) {
      const lines = items.map(({ offerId, quantity }) => {
        const offer = world.offers.get(offerId)
        const rate =
          offer.currency === 'KZT' ? { value: '1', date: null } : world.rates[offer.currency]
        return {
          offerId,
          productId: offer.productId,
          title: offer.title,
          configuration: offer.configuration,
          license: offer.license,
          ...quote({
            amount: offer.amount,
            rate: rate.value,
            sourceVat: offer.sourceVat,
            targetVat: '16',
            includesVat: offer.includesVat,
            quantity,
          }),
          sourceCurrency: offer.currency,
          rateDate: rate.date,
        }
      })
      const totalKzt = lines.reduce((sum, line) => sum + BigInt(line.totalKzt), 0n).toString()
      return { lines, totalKzt, quotedAt: world.now.toISOString() }
    },
    async findOrderByKey(key) {
      return world.orders.find((order) => order.idempotencyKey === key)?.stored ?? null
    },
    async countRecent() {
      return world.recent
    },
    async saveOrder({ order, crmLead }) {
      world.saveCalls++
      if (
        world.orders.some(
          (saved) => saved.idempotencyKey === order.idempotencyKey || saved.number === order.number,
        )
      )
        throw new DuplicateError('unique')
      const stored = {
        number: order.number,
        fingerprint: order.fingerprint,
        totalKzt: order.snapshot.totalKzt,
        savedAt: world.now.toISOString(),
        mode: order.mode,
      }
      world.orders.push({ ...order, stored })
      world.outbox.push({
        idempotencyKey: order.idempotencyKey,
        state: 'pending',
        snapshot: crmLead,
      })
      return stored
    },
    isDuplicate: (error) => error instanceof DuplicateError,
  }
  return world
}
