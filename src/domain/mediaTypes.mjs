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

/** @type {Record<string, string>} документы, на которые ссылаются тексты старого сайта */
export const DOCUMENT_TYPE_BY_EXT = {
  '.pdf': 'application/pdf',
}

/** Всё, что можно положить в «Медиа»: картинки и PDF (файлы из текстов старого сайта). */
export const FILE_TYPE_BY_EXT = { ...MEDIA_TYPE_BY_EXT, ...DOCUMENT_TYPE_BY_EXT }

/** Типы файлов, которые принимает «Медиа» при загрузке. Картинки товаров — только MEDIA_MIME_TYPES. */
export const UPLOAD_MIME_TYPES = [...new Set(Object.values(FILE_TYPE_BY_EXT))]
