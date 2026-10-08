// Импорт каталога из Битрикса с записью в базу сайта.
// Запуск: pnpm import:bitrix:write <папка> [hide-demo] [images] [images=<сколько за раз>]
//   hide-demo — снять с публикации демотовары, чтобы на сайте был только настоящий каталог;
//   images    — скачать картинки товаров со старого cad.kz в «Медиа» (другой адрес старого сайта
//               можно задать переменной IMPORT_IMAGES_FROM, например для проверки).
// Повторный запуск безопасен: обновляет изменившееся, ничего не удаляет.
// База — из DATABASE_URL в .env. Итог пишется в <папка>/import-result.md и в журнал «Запуски импорта».
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import config from '@payload-config'
import { getPayload } from 'payload'
import { importImages } from '../src/domain/bitrixImages.mjs'
import { OLD_SITE, planImport, writeImport } from '../src/domain/bitrixImport.mjs'
import { renderWriteResult } from '../src/domain/bitrixReport.mjs'
import { readExports } from './bitrixExports.mjs'

const [folder, ...words] = process.argv.slice(2)
const { catalog, error } = await readExports(folder)
if (error) {
  console.error(error)
  process.exit(1)
}
const hideDemo = words.includes('hide-demo')
const limitWord = words.find((w) => w.startsWith('images='))
const withImages = words.includes('images') || Boolean(limitWord)
const imageLimit = limitWord ? Number(limitWord.split('=')[1]) : Number.POSITIVE_INFINITY

const payload = await getPayload({ config })
const log = (message) => console.log(message)
let exitCode = 0
try {
  const plan = planImport(catalog)
  console.log(
    `К записи: товаров ${plan.products.length}, вариантов с ценой ${plan.offers.length}, производителей ${plan.manufacturers.length}`,
  )
  const result = await writeImport(payload, plan, { hideDemo, log })
  const images = withImages
    ? await importImages(payload, plan, {
        limit: imageLimit,
        base: process.env.IMPORT_IMAGES_FROM || OLD_SITE,
        log,
      })
    : null
  const report = renderWriteResult(result, images)
  await writeFile(path.join(folder, 'import-result.md'), report)
  await payload.create({
    collection: 'import-runs',
    data: {
      idempotencyKey: `bitrix:${new Date().toISOString()}`,
      snapshot: { result, images, stats: catalog.stats },
      state: 'done',
    },
    overrideAccess: true,
  })
  console.log(`\n${report}`)
} catch (err) {
  console.error('Импорт остановлен с ошибкой. Повторный запуск продолжит с того же места.')
  console.error(err)
  exitCode = 1
}
await payload.destroy()
process.exit(exitCode)
