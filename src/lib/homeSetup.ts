import type { Payload } from 'payload'
import { HOME_HERO, HOME_HERO_V1, HOME_TEXTS_AUDIT } from '../domain/homeHero'
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

/** Ключ записи в журнале «Запуски импорта»: первый экран «Подбор по задаче», один раз. */
export const HOME_HERO_KEY = 'home-setup:hero-tasks-v1'

/**
 * Первый экран главной «Подбор по задаче» (решение владельца 16.10.2026): прежние плашка и
 * заголовок о компании заменяются один раз — их и просили убрать. Если кнопки задач уже
 * заполнили в админке, первый экран не трогаем.
 */
export async function setupHomeHero(payload: Payload): Promise<string | null> {
  if (await done(payload, HOME_HERO_KEY)) return null
  const home = await payload.findGlobal({ slug: 'home-page', ...opts })
  if (home.hero?.tasks?.length) {
    await mark(payload, HOME_HERO_KEY, { hero: 'kept' })
    return 'Первый экран «Подбор по задаче» уже заполнили в админке, не трогаем.'
  }
  await payload.updateGlobal({ slug: 'home-page', data: HOME_HERO, ...opts })
  await mark(payload, HOME_HERO_KEY, { hero: 'filled', previousTitle: home.title })
  return `Первый экран «Подбор по задаче»: ${HOME_HERO.hero.tasks.length} задач (было: «${home.title}»)`
}

/** Ключ записи в журнале «Запуски импорта»: вторая редакция текстов первого экрана, один раз. */
export const HOME_HERO_V2_KEY = 'home-setup:hero-tasks-v2'

/**
 * Тексты первого экрана по замечаниям ChatGPT 16.10.2026: плашка, подзаголовок, заголовок
 * карточки и подсказка в поле. Меняет только поля, в которых ещё первая редакция (HOME_HERO_V1),
 * — правленное в админке не трогает. Кнопки задач не меняются.
 */
export async function setupHomeHeroV2(payload: Payload): Promise<string | null> {
  if (await done(payload, HOME_HERO_V2_KEY)) return null
  const home = await payload.findGlobal({ slug: 'home-page', ...opts })
  const changed: string[] = []
  const eyebrow = home.eyebrow === HOME_HERO_V1.eyebrow ? HOME_HERO.eyebrow : home.eyebrow
  if (eyebrow !== home.eyebrow) changed.push('плашка')
  const hero = { ...home.hero }
  const names = {
    lead: 'подзаголовок',
    cardTitle: 'заголовок карточки',
    placeholder: 'подсказка в поле',
  }
  for (const key of ['lead', 'cardTitle', 'placeholder'] as const) {
    if (hero[key] !== HOME_HERO_V1[key]) continue
    hero[key] = HOME_HERO.hero[key]
    changed.push(names[key])
  }
  if (changed.length)
    await payload.updateGlobal({ slug: 'home-page', data: { eyebrow, hero }, ...opts })
  await mark(payload, HOME_HERO_V2_KEY, { changed })
  return changed.length
    ? `Первый экран, вторая редакция текстов: ${changed.join(', ')}`
    : 'Тексты первого экрана правили в админке, не трогаем.'
}

/** Ключ записи в журнале «Запуски импорта»: тексты главной по аудиту 21.10.2026, один раз. */
export const HOME_TEXTS_AUDIT_KEY = 'home-setup:texts-audit-v1'

/**
 * Тексты главной по аудиту 21.10.2026: скрытый заголовок h1, первый шаг «Как мы работаем»,
 * первая карточка с действием. Меняет поле, только если в нём прежний текст из демоданных, —
 * правленное в админке не трогает. Картинок и файлов не загружает.
 */
export async function setupHomeTextsAudit(payload: Payload): Promise<string | null> {
  if (await done(payload, HOME_TEXTS_AUDIT_KEY)) return null
  const home = await payload.findGlobal({ slug: 'home-page', ...opts })
  const changed: string[] = []
  const [oldTitle, newTitle] = HOME_TEXTS_AUDIT.title
  const title = home.title === oldTitle ? newTitle : home.title
  if (title !== home.title) changed.push('скрытый заголовок')
  const [oldStep, newStep] = HOME_TEXTS_AUDIT.processFirst
  const process = (home.process ?? []).map((step) => {
    if (step.text !== oldStep) return step
    changed.push('первый шаг «Как мы работаем»')
    return { ...step, text: newStep }
  })
  const [oldCard, newCard] = HOME_TEXTS_AUDIT.sideCardFirst
  const sideCards = (home.sideCards ?? []).map((card) => {
    if (card.text !== oldCard) return card
    changed.push('карточка «Подберём комплект под ваше ТЗ»')
    return { ...card, text: newCard }
  })
  if (changed.length)
    await payload.updateGlobal({
      slug: 'home-page',
      data: { title, process, sideCards },
      ...opts,
    })
  await mark(payload, HOME_TEXTS_AUDIT_KEY, { changed })
  return changed.length
    ? `Тексты главной по аудиту: ${changed.join(', ')}`
    : 'Тексты главной правили в админке, не трогаем.'
}
