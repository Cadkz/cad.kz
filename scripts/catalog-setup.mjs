// Разделы каталога по утверждённым направлениям: новые разделы, «Правила разделов»,
// «С этим покупают» у разделов, разделы у товаров; затем приоритет показа (топы продаж первыми). Выполняется один раз (отметка в журнале
// «Запуски импорта»), при сборке на Vercel вызывается из demo-setup.
// Запуск: pnpm payload run scripts/catalog-setup.mjs

import config from '@payload-config'
import { getPayload } from 'payload'
import { setupCatalogSections } from '../src/lib/catalogSetup.ts'
import { setupPriorities } from '../src/lib/prioritySetup.ts'

const payload = await getPayload({ config })
try {
  const report = await setupCatalogSections(payload)
  if (!report) console.log('Разделы каталога уже настроены, ничего не меняем.')
  else {
    console.log(
      `Создано разделов: ${report.createdSections.length} ${report.createdSections.join(', ')}`,
    )
    console.log(`Правил разделов: ${report.rules}, пропущено: ${report.skippedRules.length}`)
    for (const line of report.skippedRules) console.log(`  пропущено — ${line}`)
    console.log(`«С этим покупают» настроено у разделов: ${report.crossSections}`)
    console.log(`АСКОН: тип исправлен у ${report.askon}`)
    const a = report.apply
    console.log(
      `Товары: проверено ${a.checked}, разделы поставлены ${a.changed}, скрыто снятых с продажи ${a.hidden}, без правила ${a.noRule}, с ручными разделами ${a.manual}`,
    )
  }
  const priority = await setupPriorities(payload)
  if (!priority) console.log('Приоритет показа уже настроен, ничего не меняем.')
  else
    console.log(
      `Приоритет показа: производители ${priority.vendors.join(', ') || '—'}; товаров ${priority.products}; разделы ${priority.sections.join(', ') || '—'}`,
    )
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
} finally {
  await payload.destroy()
}
