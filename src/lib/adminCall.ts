/** Запрос служебной страницы админки к своему API: JSON туда и обратно, ошибка — текстом сервера. */
export async function adminCall<T>(url: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(body),
  })
  const data = (await response.json().catch(() => ({}))) as T & { error?: string }
  if (!response.ok)
    throw new Error(
      data.error ??
        (response.status === 504
          ? 'Сервер не дождался ответа (больше минуты). Повторите.'
          : `Сервер не ответил (${response.status}). Повторите.`),
    )
  return data
}
