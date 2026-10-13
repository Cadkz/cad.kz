import type { Payload } from 'payload'
import { OLD_SITE } from '../domain/bitrixImport.mjs'
import { parseInfoPage } from '../domain/legacyPages.mjs'

/** Ключ записи в журнале «Запуски импорта»: настройка выполняется один раз. */
export const PRIVACY_SETUP_KEY = 'pages-setup:privacy-v1'
const OLD_PATH = '/about/privacy-policy.php'
const opts = { overrideAccess: true, depth: 0 } as const

/**
 * «Политика конфиденциальности» со старого cad.kz → «Страницы» (код privacy-policy). Если
 * страница уже есть, только отмечает настройку. Старый сайт недоступен — ничего не отмечает:
 * попробует при следующей сборке, или владелец нажмёт «Перенос со старого сайта» в админке.
 * null — уже сделано.
 */
export async function setupPrivacyPage(payload: Payload): Promise<string | null> {
  const done = await payload.find({
    collection: 'import-runs',
    where: { idempotencyKey: { equals: PRIVACY_SETUP_KEY } },
    limit: 1,
    ...opts,
  })
  if (done.docs.length) return null

  const { docs } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'privacy-policy' } },
    limit: 1,
    ...opts,
  })
  let report = 'Политика конфиденциальности уже есть в «Страницах»'
  if (!docs.length) {
    let parsed: ReturnType<typeof parseInfoPage>
    try {
      const response = await fetch(`${OLD_SITE}${OLD_PATH}`, {
        signal: AbortSignal.timeout(15_000),
        headers: { 'user-agent': 'cad.kz-migration' },
      })
      if (!response.ok) throw new Error(`ответ ${response.status}`)
      parsed = parseInfoPage(await response.text(), OLD_SITE)
    } catch (error) {
      return `Политика конфиденциальности: старый сайт недоступен (${error instanceof Error ? error.message : error}), повторим при следующей сборке`
    }
    if (!parsed) return 'Политика конфиденциальности: на старой странице нет текста'
    await payload.create({
      collection: 'pages',
      data: {
        title: parsed.title,
        status: 'published',
        slug: 'privacy-policy',
        body: parsed.body,
        seo: { title: parsed.seo.title, description: parsed.seo.description || null },
        legacyKey: `legacy:page:${OLD_PATH}`,
        legacyUrl: OLD_PATH,
      },
      ...opts,
    })
    report = 'Политика конфиденциальности перенесена со старого сайта'
  }
  await payload.create({
    collection: 'import-runs',
    data: { idempotencyKey: PRIVACY_SETUP_KEY, state: 'done', snapshot: { report } },
    ...opts,
  })
  return report
}
