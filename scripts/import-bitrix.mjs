// Импорт каталога со старого сайта на 1С-Битрикс, проверочный прогон: читает выгрузки, сводит
// товары, предложения и цены и пишет отчёт. В базу ничего не пишет (для записи — import:bitrix:write).
//
// Запуск: pnpm import:bitrix <папка с выгрузками>
// В папке — CSV каталога и предложений из «Экспорт инфоблока» и два списка из админки
// (кнопка выгрузки в Excel) с колонкой «Розничная цена».
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { renderReport } from '../src/domain/bitrixReport.mjs'
import { readExports } from './bitrixExports.mjs'

const folder = process.argv[2]
const { catalog, error } = await readExports(folder)
if (error) {
  console.error(error)
  process.exit(1)
}

const reportPath = path.join(folder, 'import-report.md')
await writeFile(reportPath, renderReport(catalog))
await writeFile(path.join(folder, 'import-preview.json'), `${JSON.stringify(catalog, null, 2)}\n`)
console.log(`\n${renderReport(catalog, { limit: 5 })}`)
console.log(`Полный отчёт: ${reportPath}`)
