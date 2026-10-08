// Общее для проверочного прогона и записи: читает папку с выгрузками Битрикса и сводит каталог.
// Имена файлов любые: тип узнаётся по заголовкам. Выгрузки не коммитить: import-data/ в .gitignore.
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { buildCatalog } from '../src/domain/bitrixCatalog.mjs'
import { detectKind, parseCsv, parseExcelHtml } from '../src/domain/bitrixFiles.mjs'

/** Возвращает сведённый каталог или текст ошибки, понятный владельцу. */
export async function readExports(folder) {
  if (!folder) return { error: 'Укажите папку с выгрузками, например: import-data' }
  const files = {}
  for (const name of await readdir(folder)) {
    if (!/\.(csv|xls|html?)$/i.test(name)) continue
    const text = await readFile(path.join(folder, name), 'utf8')
    const table = /^\s*</.test(text) ? parseExcelHtml(text) : parseCsv(text)
    const kind = detectKind(table.columns)
    if (!kind) {
      console.warn(`Пропущен ${name}: не похоже на выгрузку каталога`)
      continue
    }
    if (files[kind])
      return { error: `Два файла одного типа (${kind}): ${files[kind].name} и ${name}` }
    files[kind] = { name, records: table.records }
    console.log(`${name}: ${kind}, строк ${table.records.length}`)
  }
  if (!files.productsCsv) return { error: 'Не найдена выгрузка каталога (CSV)' }
  if (!files.offersCsv) return { error: 'Не найдена выгрузка предложений (CSV)' }
  for (const optional of ['offerPrices', 'productPrices'])
    if (!files[optional])
      console.warn(`Нет списка с ценами (${optional}): цены не будут перенесены`)

  return {
    catalog: buildCatalog({
      productsCsv: files.productsCsv.records,
      offersCsv: files.offersCsv.records,
      offerPrices: files.offerPrices?.records,
      productPrices: files.productPrices?.records,
    }),
  }
}
