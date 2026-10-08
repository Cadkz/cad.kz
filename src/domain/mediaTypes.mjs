// Форматы картинок, которые принимает «Медиа». Один список для админки и для импорта:
// импорт проверяет формат заранее и пишет понятную причину, а не ошибку Payload.

/** @type {Record<string, string>} расширение → тип файла */
export const MEDIA_TYPE_BY_EXT = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
}

/** Типы файлов, разрешённые в «Медиа». */
export const MEDIA_MIME_TYPES = [...new Set(Object.values(MEDIA_TYPE_BY_EXT))]
