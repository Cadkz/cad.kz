// Импорт каталога со старого сайта на 1С-Битрикс. Пока только проверочный прогон:
// читает выгрузки, сводит товары, предложения и цены, пишет отчёт. В базу ничего не пишет.
//
// Запуск: pnpm import:bitrix <папка с выгрузками>
// В папке — CSV каталога и предложений из «Экспорт инфоблока» и два списка из админки
// (кнопка выгрузки в Excel) с колонкой «Розничная цена». Имена файлов любые: тип узнаётся
// по заголовкам. Выгрузки не коммитить: папка import-data/ в .gitignore.
import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { buildCatalog } from '../src/domain/bitrixCatalog.mjs'
import { detectKind, parseCsv, parseExcelHtml } from '../src/domain/bitrixFiles.mjs'
import { renderReport } from '../src/domain/bitrixReport.mjs'

const folder = process.argv[2]
if (!folder) {
  console.error('Укажите папку с выгрузками: pnpm import:bitrix <папка>')
  process.exit(1)
}

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
  if (files[kind]) {
    console.error(`Два файла одного типа (${kind}): ${files[kind].name} и ${name}`)
    process.exit(1)
  }
  files[kind] = { name, records: table.records }
  console.log(`${name}: ${kind}, строк ${table.records.length}`)
}

for (const required of ['productsCsv', 'offersCsv']) {
  if (!files[required]) {
    console.error(
      `Не найдена выгрузка ${required === 'productsCsv' ? 'каталога' : 'предложений'} (CSV)`,
    )
    process.exit(1)
  }
}
for (const optional of ['offerPrices', 'productPrices'])
  if (!files[optional]) console.warn(`Нет списка с ценами (${optional}): цены не будут перенесены`)

const result = buildCatalog({
  productsCsv: files.productsCsv.records,
  offersCsv: files.offersCsv.records,
  offerPrices: files.offerPrices?.records,
  productPrices: files.productPrices?.records,
})

const reportPath = path.join(folder, 'import-report.md')
await writeFile(reportPath, renderReport(result))
await writeFile(path.join(folder, 'import-preview.json'), `${JSON.stringify(result, null, 2)}\n`)
console.log(`\n${renderReport(result, { limit: 5 })}`)
console.log(`Полный отчёт: ${reportPath}`)
