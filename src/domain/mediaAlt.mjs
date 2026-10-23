/**
 * Описание картинки по имени файла (решение владельца 23.10.2026: «картинка — перетащи», без
 * обязательных полей на каждый файл): «canon-tx-4300_front.jpg» → «canon tx 4300 front».
 * Описание можно поправить потом; пустым оно не бывает — его читают поисковики и экранные дикторы.
 * @param {string | null | undefined} filename
 */
export function altFromFilename(filename) {
  const base = String(filename ?? '')
    .split(/[\\/]/)
    .pop()
    ?.replace(/\.[a-z0-9]{2,5}$/i, '')
    .replace(/[-_.+]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return base || 'Изображение'
}
