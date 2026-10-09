import config from '@payload-config'
import { getPayload, type Payload } from 'payload'

/** Ответ JSON без кеша для служебных запросов админки. */
export function reply(body: Record<string, unknown>, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}

/** Запрос со своей же страницы: защита от отправки формы с чужого сайта от имени администратора. */
export function sameOrigin(request: Request) {
  const origin = request.headers.get('origin')
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  if (!origin || !host) return false
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

type Role = 'admin' | 'editor'
type AdminUser = { id: number | string; role?: string | null }

/**
 * Проверка запроса служебной страницы админки: JSON, со своей страницы, от пользователя с нужной
 * ролью (по умолчанию только администратор). Возвращает Payload, тело запроса и пользователя
 * или готовый ответ с ошибкой.
 */
export async function adminRequest(
  request: Request,
  maxBody: number,
  roles: Role[] = ['admin'],
): Promise<
  { payload: Payload; data: Record<string, unknown>; user: AdminUser } | { error: Response }
> {
  if (!request.headers.get('content-type')?.startsWith('application/json') || !sameOrigin(request))
    return { error: reply({ error: 'Некорректный запрос' }, 400) }
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user || !roles.some((role) => role === user.role))
    return {
      error: reply(
        {
          error:
            roles.length > 1
              ? 'Нет доступа. Войдите в админку заново.'
              : 'Доступно только администратору. Войдите в админку заново.',
        },
        403,
      ),
    }
  const text = await request.text()
  if (text.length > maxBody) return { error: reply({ error: 'Слишком большой запрос' }, 413) }
  try {
    const body: unknown = JSON.parse(text)
    if (!body || typeof body !== 'object' || Array.isArray(body))
      return { error: reply({ error: 'Некорректный запрос' }, 400) }
    return { payload, data: body as Record<string, unknown>, user }
  } catch {
    return { error: reply({ error: 'Некорректный запрос' }, 400) }
  }
}
