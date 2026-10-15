// Таблицы в описаниях товаров (замечание владельца 15.10.2026): первый перенос из Битрикса
// раскладывал таблицу по ячейке в строку — у AutoCAD сравнение с AutoCAD LT шло столбиком
// «Командная строка», «✓», «✓». Таблицы берутся со страницы товара старого сайта и встают
// на место столбика (`withTables`); текст, правленный в админке, не трогается.
import { descriptionTables } from './bitrixText.mjs'
import { withTables } from './tables.mjs'
import { cleanCardText } from './textCleanup.mjs'

/**
 * Описание товара с таблицами вместо столбиков. pageHtml — страница товара на старом сайте
 * (или HTML описания из Битрикса). Перенесённые описания прошли чистку карточек
 * (`cleanCardText`), поэтому столбик и таблица чистятся так же, чтобы совпасть с текстом.
 * @param {string} description
 * @param {string} pageHtml
 * @returns {{ description: string, replaced: number }}
 */
export function restoreProductTables(description, pageHtml) {
  const tables = descriptionTables(pageHtml).map(({ flat, markup }) => ({
    flat: cleanCardText(flat),
    markup: cleanCardText(markup),
  }))
  if (!tables.length || !description) return { description, replaced: 0 }
  const { body, replaced } = withTables(description, tables)
  return { description: replaced ? body : description, replaced }
}
