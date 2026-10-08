import config from '@payload-config'
import { getPayload } from 'payload'
import { finishRun, imagesPart, type RunReply, startRun, writePart } from '@/lib/bitrixImportRun'

/**
 * Импорт из Битрикса со страницы админки: только для администратора. Каждый запрос — один шаг
 * (начало, часть товаров, часть вариантов, конец, часть картинок), см. src/lib/bitrixImportRun.ts.
 */

// Шаг пишет до 20 секунд и ещё докачивает начатую картинку; запас до лимита хостинга.
export const maxDuration = 60

/** Части приходят уже разобранными в браузере; описания товаров бывают длинными. */
const MAX_BODY = 3_500_000

function reply(body: Record<string, unknown>, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}

/** Запрос со своей же страницы: защита от отправки формы с чужого сайта от имени администратора. */
function sameOrigin(request: Request) {
  const origin = request.headers.get('origin')
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  if (!origin || !host) return false
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

function send(result: RunReply) {
  if (!result.ok) return reply({ error: result.error }, result.status)
  return reply(result)
}

export async function POST(request: Request) {
  if (!request.headers.get('content-type')?.startsWith('application/json') || !sameOrigin(request))
    return reply({ error: 'Некорректный запрос' }, 400)

  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  if (user?.role !== 'admin')
    return reply({ error: 'Импорт доступен только администратору. Войдите в админку заново.' }, 403)

  const text = await request.text()
  if (text.length > MAX_BODY) return reply({ error: 'Слишком большая часть импорта' }, 413)
  let body: unknown
  try {
    body = JSON.parse(text)
  } catch {
    return reply({ error: 'Некорректный запрос' }, 400)
  }
  if (!body || typeof body !== 'object' || Array.isArray(body))
    return reply({ error: 'Некорректный запрос' }, 400)
  const data = body as Record<string, unknown>

  try {
    switch (data.action) {
      case 'start':
        return send(await startRun(payload, data, String(user.id)))
      case 'products':
        return send(await writePart(payload, 'product', data))
      case 'offers':
        return send(await writePart(payload, 'offer', data))
      case 'finish':
        return send(await finishRun(payload, data))
      case 'images':
        return send(await imagesPart(payload, data))
      default:
        return reply({ error: 'Неизвестный шаг импорта' }, 400)
    }
  } catch (error) {
    console.error('Импорт из Битрикса: ошибка шага', data.action, error)
    return reply(
      {
        error:
          'Шаг импорта не выполнен из-за ошибки на сервере. Повторите: записанное не пропадёт.',
      },
      500,
    )
  }
}
