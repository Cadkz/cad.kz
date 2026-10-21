import type { Payload } from 'payload'
import { VENDOR_LOGOS } from '../domain/cardLogos.mjs'
import { relId } from './rel'

/** Ключ записи в журнале «Запуски импорта»: настройка выполняется один раз. */
export const CARD_LOGOS_KEY = 'catalog-setup:card-logos-v1'
const opts = { overrideAccess: true, depth: 0 } as const

const low = (value: string | null | undefined) => String(value ?? '').toLowerCase()

/**
 * Логотипы производителей для карточек программ (решение владельца 21.10.2026): берёт логотипы из
 * блока «Официальный партнёр» на главной (Autodesk, Fine Software, CSoft — скачаны со старого
 * cad.kz) и ставит в поле «Логотип» производителя, если оно пустое. Производителям с логотипом
 * в коде (SCAD, ЛИРА, АВС, Artec — src/domain/cardLogos.mjs) не ставит: у них знак программы.
 * Один раз; дальше правится в админке. null — уже сделано.
 */
export async function setupCardLogos(payload: Payload): Promise<string[] | null> {
  const done = await payload.find({
    collection: 'import-runs',
    where: { idempotencyKey: { equals: CARD_LOGOS_KEY } },
    limit: 1,
    ...opts,
  })
  if (done.docs.length) return null

  const [home, vendors] = await Promise.all([
    payload.findGlobal({ slug: 'home-page', ...opts }),
    payload.find({ collection: 'manufacturers', pagination: false, ...opts }),
  ])
  const coded = new Set(Object.keys(VENDOR_LOGOS).map(low))
  const set: string[] = []
  for (const partner of home.trust?.partners ?? []) {
    const logo = relId(partner.logo)
    if (logo == null || coded.has(low(partner.vendor))) continue
    const vendor = vendors.docs.find((doc) => low(doc.title) === low(partner.vendor))
    if (!vendor || relId(vendor.logo) != null) continue
    await payload.update({ collection: 'manufacturers', id: vendor.id, data: { logo }, ...opts })
    set.push(vendor.title)
  }
  const report = [`Логотипы производителей для карточек: ${set.join(', ') || '—'}`]
  await payload.create({
    collection: 'import-runs',
    data: { idempotencyKey: CARD_LOGOS_KEY, state: 'done', snapshot: { report } },
    ...opts,
  })
  return report
}
