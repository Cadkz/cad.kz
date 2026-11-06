import config from '@payload-config'
import { getPayload } from 'payload'
import { isTermKey, TERMS_PER_REQUEST } from '@/domain/terms.mjs'
import {
  BIG_PART_CHARS,
  DOCS_PER_REQUEST,
  nextPart,
  PART_CHARS,
  writeTranslationXlsx,
} from '@/domain/translationTable.mjs'
import { adminRequest, reply } from '@/lib/adminApi'
import { refreshSiteData } from '@/lib/siteCache'
import { planTerms, saveTerm, termTableGroups } from '@/lib/termTable'
import { planTranslations, saveTranslation, translationGroups } from '@/lib/translationTable'

/**
 * «Переводы» в админке (администратор и маркетолог).
 * GET ?part=next — следующая часть непереведённого, ?part=big — втрое больше, ?part=all — вся таблица: файл Excel.
 * &set=terms — то же для словаря характеристик и комплектаций (src/domain/terms.mjs).
 * POST check — что запишется из загруженной таблицы; POST apply — запись (по нескольку товаров
 * или до TERMS_PER_REQUEST строк словаря за запрос, чтобы уложиться в минуту Vercel). В одном
 * файле могут быть и тексты товаров, и строки словаря.
 */
export const maxDuration = 60

const MAX_BODY = 6_000_000

function stamp() {
  const now = new Date(Date.now() + 5 * 3_600_000)
  return now.toISOString().slice(0, 16).replace('T', '-').replace(':', '')
}

export async function GET(request: Request) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user || (user.role !== 'admin' && user.role !== 'editor'))
    return new Response('Нет доступа. Войдите в админку.', { status: 403 })
  const params = new URL(request.url).searchParams
  const part = params.get('part')
  const terms = params.get('set') === 'terms'
  const all = part === 'all'
  const groups = terms ? await termTableGroups(payload) : await translationGroups(payload)
  const rows = all ? groups.flat() : nextPart(groups, part === 'big' ? BIG_PART_CHARS : PART_CHARS)
  if (!rows.length) return new Response('Всё уже переведено.', { status: 404 })
  const name = `perevody-${terms ? 'slovar-' : ''}${all ? 'vse' : 'chast'}-${stamp()}.xlsx`
  return new Response(new Uint8Array(writeTranslationXlsx(rows)), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${name}"`,
      'Cache-Control': 'no-store',
    },
  })
}

type Row = { key: string; kk: string; en: string }

function rowsOf(value: unknown): Row[] | null {
  if (!Array.isArray(value)) return null
  const rows: Row[] = []
  for (const item of value) {
    if (!item || typeof item !== 'object') return null
    const { key, kk, en } = item as Record<string, unknown>
    if (typeof key !== 'string' || typeof kk !== 'string' || typeof en !== 'string') return null
    rows.push({ key, kk, en })
  }
  return rows
}

export async function POST(request: Request) {
  const checked = await adminRequest(request, MAX_BODY, ['admin', 'editor'])
  if ('error' in checked) return checked.error
  const { payload, data } = checked
  const rows = rowsOf(data.rows)
  if (!rows) return reply({ error: 'Некорректные строки таблицы' }, 400)
  const termRows = rows.filter((row) => isTermKey(row.key))
  const docRows = rows.filter((row) => !isTermKey(row.key))
  const [plan, termPlan] = await Promise.all([
    docRows.length ? planTranslations(payload, docRows) : null,
    termRows.length ? planTerms(payload, termRows) : null,
  ])
  const updates = plan?.updates ?? []
  const termUpdates = termPlan?.updates ?? []
  if (data.action === 'check') {
    const problems = [...(plan?.problems ?? []), ...(termPlan?.problems ?? [])]
    return reply({
      docs: updates.length,
      terms: termUpdates.length,
      texts:
        updates.reduce((sum, update) => sum + update.texts, 0) +
        termUpdates.reduce((sum, update) => sum + Object.keys(update.data).length, 0),
      unchanged: (plan?.unchanged ?? 0) + (termPlan?.unchanged ?? 0),
      problems: problems.slice(0, 200),
      problemCount: problems.length,
    })
  }
  if (data.action !== 'apply') return reply({ error: 'Неизвестный шаг' }, 400)
  if (updates.length > DOCS_PER_REQUEST || termUpdates.length > TERMS_PER_REQUEST)
    return reply({ error: 'Слишком много строк за один раз' }, 413)
  const failed: string[] = []
  let saved = 0
  for (const update of updates) {
    try {
      await saveTranslation(payload, update)
      saved += update.texts
    } catch (failure) {
      payload.logger.error({ err: failure, msg: `Перевод ${update.collection}:${update.id}` })
      failed.push(`${update.collection}:${update.id}`)
    }
  }
  for (const update of termUpdates) {
    try {
      await saveTerm(payload, update)
      saved += Object.keys(update.data).length
    } catch (failure) {
      payload.logger.error({ err: failure, msg: `Словарь: ${update.ru}` })
      failed.push(`словарь «${update.ru.slice(0, 40)}»`)
    }
  }
  refreshSiteData()
  return reply({ saved, failed })
}
