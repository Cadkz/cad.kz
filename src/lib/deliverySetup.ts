import type { Payload } from 'payload'
import { ASKON_OLD, PRODUCT_DELIVERY, VENDOR_DELIVERY } from '../domain/deliveryTerms.mjs'

/** Ключ записи в журнале «Запуски импорта»: настройка выполняется один раз. */
export const DELIVERY_SETUP_KEY = 'catalog-setup:delivery-2026-11-06'
const opts = { overrideAccess: true, depth: 0 } as const
const LANGS = ['ru', 'kk', 'en'] as const
type Texts = Record<(typeof LANGS)[number], string>

const norm = (text: string) => text.trim().toLowerCase()

/** Пишет тексты на трёх языках, если в русской версии поле ещё пустое (правленое не трогает). */
async function fill(
  payload: Payload,
  collection: 'manufacturers' | 'products',
  id: number,
  data: (lang: (typeof LANGS)[number]) => Record<string, string>,
) {
  for (const locale of LANGS)
    await payload.update({ collection, id, data: data(locale), locale, ...opts })
}

/** Сроки поставки по производителям и у отдельных товаров (src/domain/deliveryTerms.mjs). */
export async function setupDelivery(payload: Payload): Promise<string[] | null> {
  const done = await payload.find({
    collection: 'import-runs',
    where: { idempotencyKey: { equals: DELIVERY_SETUP_KEY } },
    limit: 1,
    ...opts,
  })
  if (done.docs.length) return null
  const report: string[] = []
  const vendors = await payload.find({
    collection: 'manufacturers',
    limit: 500,
    locale: 'ru',
    ...opts,
  })
  for (const entry of VENDOR_DELIVERY) {
    const vendor = vendors.docs.find((doc) => norm(doc.title) === norm(entry.title))
    if (!vendor) continue
    const software: Texts | undefined = vendor.deliverySoftware ? undefined : entry.software
    const hardware: Texts | undefined = vendor.deliveryHardware ? undefined : entry.hardware
    if (!software && !hardware) continue
    await fill(payload, 'manufacturers', vendor.id, (lang) => ({
      ...(software ? { deliverySoftware: software[lang] } : {}),
      ...(hardware ? { deliveryHardware: hardware[lang] } : {}),
    }))
    report.push(vendor.title)
  }
  const products = await payload.find({
    collection: 'products',
    where: { kind: { equals: 'hardware' } },
    limit: 1000,
    locale: 'ru',
    select: { title: true, delivery: true },
    ...opts,
  })
  for (const entry of PRODUCT_DELIVERY) {
    for (const product of products.docs) {
      if (!entry.title.test(product.title) || product.delivery) continue
      await fill(payload, 'products', product.id, (lang) => ({ delivery: entry.delivery[lang] }))
      report.push(product.title)
    }
  }
  await payload.create({
    collection: 'import-runs',
    data: { idempotencyKey: DELIVERY_SETUP_KEY, state: 'done', snapshot: { report } },
    ...opts,
  })
  return [`сроки поставки: ${report.join(', ') || 'нечего заполнять'}`]
}

/** Ключ второй настройки: АСКОН «до 5 дней» вместо «от 5 дней». */
export const ASKON_SETUP_KEY = 'catalog-setup:delivery-askon-2026-11-06'

/** АСКОН — «до 5 дней» на трёх языках, только где стоит прежний текст. */
export async function setupAskonDelivery(payload: Payload): Promise<string[] | null> {
  const done = await payload.find({
    collection: 'import-runs',
    where: { idempotencyKey: { equals: ASKON_SETUP_KEY } },
    limit: 1,
    ...opts,
  })
  if (done.docs.length) return null
  const entry = VENDOR_DELIVERY.find((item) => item.title === 'АСКОН')
  const vendors = await payload.find({
    collection: 'manufacturers',
    limit: 500,
    locale: 'all',
    ...opts,
  })
  const vendor = vendors.docs.find((doc) => {
    const title = doc.title as unknown
    const ru = typeof title === 'string' ? title : (title as Record<string, string>)?.ru
    return typeof ru === 'string' && norm(ru) === 'аскон'
  })
  let changed = 0
  if (vendor && entry?.software) {
    const current = vendor.deliverySoftware as unknown as Record<string, string> | null
    for (const lang of LANGS) {
      if ((current?.[lang] ?? '') !== ASKON_OLD[lang]) continue
      await payload.update({
        collection: 'manufacturers',
        id: vendor.id,
        data: { deliverySoftware: entry.software[lang] },
        locale: lang,
        ...opts,
      })
      changed += 1
    }
  }
  await payload.create({
    collection: 'import-runs',
    data: { idempotencyKey: ASKON_SETUP_KEY, state: 'done', snapshot: { changed } },
    ...opts,
  })
  return [`АСКОН: «до 5 дней», языков исправлено ${changed}`]
}
