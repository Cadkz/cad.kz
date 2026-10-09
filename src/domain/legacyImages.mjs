// Картинки в текстах, перенесённых со старого cad.kz: сравнение текста без картинок и возврат
// картинок, которые шаг «Картинки в текстах» убрал по ошибке (сбой сохранения, таймаут), а не
// потому что файла на старом сайте нет.

/** Картинка в тексте: ![описание](адрес). */
const IMAGE = /!\[[^\]]*\]\([^)\s]+\)/g
/** Ссылка, от которой после удаления картинки остались пустые скобки: [](адрес). */
const EMPTY_LINK = /\[\s*\]\([^)\s]*\)/g

/** Адреса картинок текста по порядку. */
export function imageUrls(body) {
  return [...String(body ?? '').matchAll(/!\[[^\]]*\]\(([^)\s]+)\)/g)].map((m) => m[1])
}

/** Текст без картинок и без пробельной разницы: для сравнения «текст тот же». */
export function withoutImages(body) {
  return String(body ?? '')
    .replace(IMAGE, ' ')
    .replace(EMPTY_LINK, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Ключ «Медиа» для файла старого сайта — тот же, что при скачивании картинок из текстов.
 * @param {string} url полный адрес на старом сайте
 */
export function legacyFileKey(url) {
  try {
    return `legacy:file:${decodeURIComponent(new URL(url).pathname)}`
  } catch {
    return null
  }
}

/**
 * Вернуть картинки в текст. current — текст в базе, fresh — тот же текст, заново разобранный
 * со старой страницы (адреса картинок старого сайта). mediaUrl(старый адрес) — адрес уже
 * скачанной картинки в «Медиа» или null.
 *
 * Возвращает новый текст или null, если трогать нечего: картинок в базе не меньше, чем на
 * старой странице, или текст без картинок отличается (его правили в админке — не перетираем).
 * Картинка, которой нет в «Медиа», возвращается со старым адресом: её скачает шаг 2.
 * @param {string} current
 * @param {string} fresh
 * @param {(url: string) => string | null} mediaUrl
 */
export function restoredBody(current, fresh, mediaUrl) {
  const before = imageUrls(current).length
  const wanted = imageUrls(fresh).length
  if (wanted <= before) return null
  if (withoutImages(current) !== withoutImages(fresh)) return null
  return String(fresh).replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (whole, alt, url) => {
    const found = mediaUrl(url)
    return found ? `![${alt}](${found})` : whole
  })
}

/**
 * Убирать картинку из текста можно, только если файла на старом сайте нет совсем (404) или его
 * формат «Медиа» не примет никогда. Сбой сети или сохранения — не повод: повтор докачает.
 * @param {unknown} error
 */
export function isPermanentImageFailure(error) {
  const message = error instanceof Error ? error.message : String(error)
  return message === 'ответ 404' || message === 'ответ 410' || message.startsWith('формат')
}
