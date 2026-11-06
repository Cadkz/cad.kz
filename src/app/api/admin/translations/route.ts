import config from '@payload-config'
import { getPayload } from 'payload'
import {
  BIG_PART_CHARS,
  DOCS_PER_REQUEST,
  nextPart,
  PART_CHARS,
  writeTranslationXlsx,
} from '@/domain/translationTable.mjs'
import { adminRequest, reply } from '@/lib/adminApi'
import { refreshSiteData } from '@/lib/siteCache'
import { planTranslations, saveTranslation, translationGroups } from '@/lib/translationTable'

/**
 * «Переводы» в админке (администратор и маркетолог).
 * GET ?part=next — следующая часть непереведённого, ?part=big — втрое больше, ?part=all — вся таблица: файл Excel.
 * POST check — что запишется из загруженной таблицы; POST apply — запись (по нескольку товаров
 * за запрос, чтобы уложиться в минуту Vercel).
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
  const part = new URL(request.url).searchParams.get('part')
  const all = part === 'all'
  const groups = await translationGroups(payload)
  const rows = all ? groups.flat() : nextPart(groups, part === 'big' ? BIG_PART_CHARS : PART_CHARS)
  if (!rows.length) return new Response('Всё уже переведено.', { status: 404 })
  const name = `perevody-${all ? 'vse' : 'chast'}-${stamp()}.xlsx`
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
  const plan = await planTranslations(payload, rows)
  if (data.action === 'check')
    return reply({
      docs: plan.updates.length,
      texts: plan.updates.reduce((sum, update) => sum + update.texts, 0),
      unchanged: plan.unchanged,
      problems: plan.problems.slice(0, 200),
      problemCount: plan.problems.length,
    })
  if (data.action !== 'apply') return reply({ error: 'Неизвестный шаг' }, 400)
  if (plan.updates.length > DOCS_PER_REQUEST)
    return reply({ error: 'Слишком много товаров за один раз' }, 413)
  const failed: string[] = []
  let saved = 0
  for (const update of plan.updates) {
    try {
      await saveTranslation(payload, update)
      saved += update.texts
    } catch (failure) {
      payload.logger.error({ err: failure, msg: `Перевод ${update.collection}:${update.id}` })
      failed.push(`${update.collection}:${update.id}`)
    }
  }
  refreshSiteData()
  return reply({ saved, failed })
}
