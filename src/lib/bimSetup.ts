import type { Payload } from 'payload'
import { BIM_PAGE } from '../domain/bimPageSeed.mjs'

/** Ключ записи в журнале «Запуски импорта»: настройка выполняется один раз. */
export const BIM_SETUP_KEY = 'pages-setup:bim-v1'
const opts = { overrideAccess: true, depth: 0 } as const

/**
 * Страница «Внедрение BIM» (/bim) в «Страницах» с кодом bim: заготовка текста из
 * src/domain/bimPageSeed.mjs. Уже есть — не трогаем. null — уже сделано.
 */
export async function setupBimPage(payload: Payload): Promise<string | null> {
  const done = await payload.find({
    collection: 'import-runs',
    where: { idempotencyKey: { equals: BIM_SETUP_KEY } },
    limit: 1,
    ...opts,
  })
  if (done.docs.length) return null
  const { docs } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: BIM_PAGE.slug } },
    limit: 1,
    ...opts,
  })
  let report = 'Страница «Внедрение BIM» уже есть в «Страницах»'
  if (!docs.length) {
    await payload.create({
      collection: 'pages',
      data: {
        title: BIM_PAGE.title,
        status: 'published',
        slug: BIM_PAGE.slug,
        lead: BIM_PAGE.lead,
        body: BIM_PAGE.body,
        seo: { title: `${BIM_PAGE.title} — CAD.kz`, description: BIM_PAGE.seoDescription },
      },
      ...opts,
    })
    report = 'Страница «Внедрение BIM» создана (текст правится в «Страницах», код bim)'
  }
  await payload.create({
    collection: 'import-runs',
    data: { idempotencyKey: BIM_SETUP_KEY, state: 'done', snapshot: { report } },
    ...opts,
  })
  return report
}
