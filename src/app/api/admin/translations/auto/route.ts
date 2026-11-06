import { ModelError } from '@/domain/anthropicChat.mjs'
import { AUTO_MODEL, autoPart, translateRows } from '@/domain/autoTranslate.mjs'
import { adminRequest, reply } from '@/lib/adminApi'
import { refreshSiteData } from '@/lib/siteCache'
import { planTerms, saveTerm, termTableGroups } from '@/lib/termTable'
import { planTranslations, saveTranslation, translationGroups } from '@/lib/translationTable'

/**
 * Автоперевод (админка → «Переводы», администратор и маркетолог): одна часть за запрос —
 * взять непереведённые строки своей дорожки, перевести моделью, проверить как загрузку таблицы
 * и записать. Браузер повторяет запрос, пока не придёт done. Ключи, которые не удалось
 * перевести или записать, возвращаются в skip — браузер передаёт их обратно, чтобы не крутить
 * одну и ту же строку. Логика части и ответа модели — src/domain/autoTranslate.mjs.
 *
 * POST { set: 'docs' | 'terms', lane, lanes, skip: string[] }
 */
export const maxDuration = 300

const MAX_BODY = 2_000_000
const MAX_LANES = 8

const keyOf = (key: string) =>
  key.startsWith('terms:') ? key : key.split(':').slice(0, 2).join(':')

function numberIn(value: unknown, min: number, max: number, fallback: number) {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max
    ? value
    : fallback
}

export async function POST(request: Request) {
  const checked = await adminRequest(request, MAX_BODY, ['admin', 'editor'])
  if ('error' in checked) return checked.error
  const { payload, data } = checked
  const apiKey = process.env.MODEL_API_KEY ?? ''
  if (!apiKey)
    return reply({ error: 'Модель не подключена: нет ключа MODEL_API_KEY в Vercel.' }, 503)
  const terms = data.set === 'terms'
  const lanes = numberIn(data.lanes, 1, MAX_LANES, 1)
  const lane = numberIn(data.lane, 0, lanes - 1, 0)
  const skip = new Set(
    Array.isArray(data.skip) ? data.skip.filter((key) => typeof key === 'string') : [],
  )

  const groups = terms ? await termTableGroups(payload) : await translationGroups(payload)
  const sent = autoPart(groups, { lane, lanes, skip })
  if (!sent.length) return reply({ done: true })

  let translated: Awaited<ReturnType<typeof translateRows>>
  try {
    translated = await translateRows({
      fetchImpl: fetch,
      apiKey,
      model: process.env.TRANSLATE_MODEL?.trim() || AUTO_MODEL,
      rows: sent,
    })
  } catch (failure) {
    const status = failure instanceof ModelError ? failure.status : null
    payload.logger.error({ err: failure, msg: 'Автоперевод: модель' })
    if (status === 401 || status === 403)
      return reply({ error: 'Модель отклонила ключ: проверьте MODEL_API_KEY в Vercel.' }, 502)
    // Перегрузка, лимит или сеть: браузер подождёт и повторит.
    return reply({ error: 'Модель временно не ответила.', retry: true }, 503)
  }

  const skipped = new Set(translated.missing)
  const problems: { key: string; lang: 'kk' | 'en'; reason: string }[] = []
  let saved = 0
  if (translated.rows.length) {
    const termPlan = terms ? await planTerms(payload, translated.rows) : null
    const docPlan = terms ? null : await planTranslations(payload, translated.rows)
    for (const problem of termPlan?.problems ?? docPlan?.problems ?? []) {
      skipped.add(problem.key)
      problems.push(problem)
    }
    if (termPlan) {
      for (const update of termPlan.updates) {
        try {
          await saveTerm(payload, update)
          saved += Object.keys(update.data).length
        } catch (failure) {
          payload.logger.error({ err: failure, msg: `Автоперевод, словарь: ${update.ru}` })
          skipped.add(`terms:${update.ru}`)
        }
      }
    } else {
      for (const update of docPlan?.updates ?? []) {
        try {
          await saveTranslation(payload, update)
          saved += update.texts
        } catch (failure) {
          payload.logger.error({ err: failure, msg: `Автоперевод ${update.collection}` })
          const doc = `${update.collection}:${update.id}`
          for (const row of sent) if (keyOf(row.key) === doc) skipped.add(row.key)
        }
      }
    }
    refreshSiteData()
  }
  return reply({
    done: false,
    sent: sent.length,
    chars: sent.reduce((sum, row) => sum + row.ru.length, 0),
    saved,
    skip: [...skipped],
    problems: problems.slice(0, 20),
  })
}
