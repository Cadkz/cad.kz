/** Загрузка картинки в «Медиа» из админки (вставка и перетаскивание в редактор текста). */

type MediaDoc = { url?: string | null; alt?: string | null }

/** Картинка с компьютера или из буфера → «Медиа» (как загрузка в разделе «Медиа»). */
export async function uploadImage(file: File): Promise<{ url: string; alt: string }> {
  const alt =
    file.name
      .replace(/\.[^.]+$/, '')
      .replace(/[-_]+/g, ' ')
      .trim() || 'Картинка'
  const form = new FormData()
  form.append('file', file)
  form.append('_payload', JSON.stringify({ alt }))
  const response = await fetch('/api/media', { method: 'POST', body: form, credentials: 'include' })
  const data = (await response.json().catch(() => null)) as {
    doc?: MediaDoc
    errors?: { message?: string }[]
  } | null
  const url = data?.doc?.url
  if (!response.ok || !url)
    throw new Error(
      data?.errors?.[0]?.message ?? `Картинка не загрузилась (ответ ${response.status}).`,
    )
  return { url, alt: data?.doc?.alt ?? alt }
}
