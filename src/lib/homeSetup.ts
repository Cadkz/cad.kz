import type { Payload } from 'payload'
import { TRUST_DATA, TRUST_SEED, TRUST_SEED_V1_VENDORS } from '../domain/homeTrust.mjs'
import { mediaFor, oldSite } from './legacyContentRun'

/** Ключи записей в журнале «Запуски импорта»: каждая версия выполняется один раз. */
export const HOME_TRUST_KEY = 'home-setup:trust-v1'
export const HOME_TRUST_V2_KEY = 'home-setup:trust-v2'
const opts = { overrideAccess: true, depth: 0 } as const

async function done(payload: Payload, key: string) {
  const found = await payload.find({
    collection: 'import-runs',
    where: { idempotencyKey: { equals: key } },
    limit: 1,
    ...opts,
  })
  return found.docs.length > 0
}

async function mark(payload: Payload, key: string, snapshot: Record<string, unknown>) {
  await payload.create({
    collection: 'import-runs',
    data: { idempotencyKey: key, state: 'done', snapshot },
    ...opts,
  })
}

/** Блок пуст или в нём ровно первое наполнение (v1) — значит, вручную его не правили. */
function untouched(vendors: string[]) {
  return (
    !vendors.length ||
    (vendors.length === TRUST_SEED_V1_VENDORS.length &&
      vendors.every((v, i) => v === TRUST_SEED_V1_VENDORS[i]))
  )
}

/** Логотип со старого cad.kz → «Медиа». Не скачался — партнёр показывается названием. */
async function logoFor(payload: Payload, vendor: string, logoPath: string | null) {
  if (!logoPath) return { id: null, failed: null }
  try {
    const { media } = await mediaFor(payload, `${oldSite()}${logoPath}`, vendor)
    return { id: media.id, failed: null }
  } catch (error) {
    return { id: null, failed: `${vendor}: ${error instanceof Error ? error.message : error}` }
  }
}

/**
 * Блок «Официальный партнёр производителей» на главной: коротко — заголовок и логотипы
 * (решение владельца 11.10.2026). Заполняет блок, только если он пуст или в нём первое
 * наполнение; блок, который правили в админке, не трогает. Выполняется один раз.
 */
export async function setupHomeTrust(payload: Payload): Promise<string | null> {
  if (await done(payload, HOME_TRUST_V2_KEY)) return null
  const home = await payload.findGlobal({ slug: 'home-page', ...opts })
  const vendors = (home.trust?.partners ?? []).map((p) => p.vendor)
  if (!untouched(vendors)) {
    await mark(payload, HOME_TRUST_V2_KEY, { trust: 'kept' })
    return 'Блок «Официальный партнёр» уже правили в админке, не трогаем.'
  }
  const failed: string[] = []
  const partners = []
  for (const { vendor, logoPath } of TRUST_SEED.partners) {
    const logo = await logoFor(payload, vendor, logoPath)
    if (logo.failed) failed.push(logo.failed)
    partners.push(logo.id ? { vendor, logo: logo.id } : { vendor })
  }
  await payload.updateGlobal({
    slug: 'home-page',
    data: { trust: { ...TRUST_DATA, partners } },
    ...opts,
  })
  const withLogo = partners.filter((p) => 'logo' in p).length
  await mark(payload, HOME_TRUST_V2_KEY, { trust: 'filled', withLogo, failed })
  if (!(await done(payload, HOME_TRUST_KEY))) await mark(payload, HOME_TRUST_KEY, {})
  return `Блок «Официальный партнёр»: ${partners.length} производителей, с логотипом ${withLogo}${failed.length ? `; не скачалось: ${failed.join('; ')}` : ''}`
}
