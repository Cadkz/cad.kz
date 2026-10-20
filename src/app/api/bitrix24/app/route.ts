import config from '@payload-config'
import { getPayload } from 'payload'
import { appPage, parseForm, readPlacement } from '@/domain/openLine.mjs'
import { handleEvent } from '@/lib/openLine/events'
import { connectLine, installApp, type SetupResult } from '@/lib/openLine/setup'

/**
 * Обработчик локального приложения Битрикс24 «Кадди на сайте» (открытая линия). Один адрес на всё:
 * - установка (адрес для первоначальной установки — тот же с ?install=1) и страница приложения;
 * - настройки канала в контакт-центре (PLACEMENT=SETTING_CONNECTOR): подключить к линии;
 * - события: ответ оператора клиенту, отключение канала, удаление приложения.
 * Подлинность проверяется ключом приложения (BITRIX24_APP_CLIENT_SECRET) или токеном приложения.
 */
export const maxDuration = 30

const MAX_BODY = 256_000

function html(result: SetupResult, finish = false) {
  return new Response(appPage({ ...result, finish }), {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}

function text(body: string, status: number) {
  return new Response(body, {
    status,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}

async function readBody(request: Request): Promise<Record<string, unknown> | null> {
  const raw = await request.text()
  if (raw.length > MAX_BODY) return null
  if (request.headers.get('content-type')?.includes('application/json')) {
    try {
      const value: unknown = JSON.parse(raw)
      return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
    } catch {
      return null
    }
  }
  return parseForm(raw)
}

export async function GET() {
  return text('Обработчик приложения Битрикс24 для сайта cad.kz. Открывается из Битрикс24.', 200)
}

export async function POST(request: Request) {
  const body = await readBody(request)
  if (!body) return text('Некорректный запрос', 400)
  const url = new URL(request.url)
  const payload = await getPayload({ config })

  if (typeof body.event === 'string') {
    const status = await handleEvent(payload, body)
    return text(status === 200 ? 'ok' : 'error', status)
  }

  const refreshToken = typeof body.REFRESH_ID === 'string' ? body.REFRESH_ID : ''
  if (!refreshToken)
    return html({
      ok: false,
      title: 'Откройте приложение из Битрикс24',
      lines: ['Эта страница работает только внутри портала Битрикс24.'],
    })
  const handlerUrl = `${url.origin}/api/bitrix24/app`
  const applicationToken =
    typeof body.APPLICATION_TOKEN === 'string' ? body.APPLICATION_TOKEN : undefined

  if (body.PLACEMENT === 'SETTING_CONNECTOR') {
    const placement = readPlacement(body.PLACEMENT_OPTIONS)
    if (!placement)
      return html({
        ok: false,
        title: 'Не видно, какая линия',
        lines: ['Выберите открытую линию и нажмите «Подключить» ещё раз.'],
      })
    return html(
      await connectLine(payload, {
        refreshToken,
        applicationToken,
        handlerUrl,
        siteUrl: url.origin,
        line: placement.line,
      }),
    )
  }

  const result = await installApp(payload, { refreshToken, applicationToken, handlerUrl })
  // Установка завершается вызовом BX24.installFinish на странице, иначе приложение не «встанет».
  return html(result, result.ok && url.searchParams.get('install') === '1')
}
