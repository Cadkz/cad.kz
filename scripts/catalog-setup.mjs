// Разделы каталога по утверждённым направлениям: новые разделы, «Правила разделов»,
// «С этим покупают» у разделов, разделы у товаров; затем приоритет показа (топы продаж первыми);
// затем вторая настройка: дубли производителей, линейки, приложения в конец, темы новостей;
// затем подбор AutoCAD и SCAD Office и семейство сателлитов SCAD; другие названия для поиска. Выполняется один раз (отметка в журнале
// «Запуски импорта»), при сборке на Vercel вызывается из demo-setup.
// Запуск: pnpm payload run scripts/catalog-setup.mjs

import config from '@payload-config'
import { getPayload } from 'payload'
import { setupCatalogSections } from '../src/lib/catalogSetup.ts'
import { setupPicker, setupPickerV2 } from '../src/lib/pickerSetup.ts'
import { setupPickerV3 } from '../src/lib/pickerSetupV3.ts'
import { setupPriorities } from '../src/lib/prioritySetup.ts'
import { setupSearchAliases } from '../src/lib/searchSetup.ts'
import { setupVendors } from '../src/lib/vendorsSetup.ts'

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
  const vendors = await setupVendors(payload)
  if (!vendors) console.log('Производители, линейки и темы уже настроены, ничего не меняем.')
  else {
    console.log(`Дубли производителей: ${vendors.merged.join('; ') || '—'}`)
    console.log(`Топ у производителей: ${vendors.vendorLevels.join(', ') || '—'}`)
    console.log(`Приложения в конец: ${vendors.apps.length} ${vendors.apps.join('; ')}`)
    console.log(`Порядок производителей: ${vendors.sections.join(', ') || '—'}`)
    console.log(`Линейки: ${vendors.lines.join('; ')}; товаров в линейках ${vendors.lineProducts}`)
    console.log(`Темы публикаций: ${JSON.stringify(vendors.topics)}`)
  }
  const picker = await setupPicker(payload)
  if (!picker) console.log('Подбор AutoCAD и SCAD уже настроен, ничего не меняем.')
  else {
    console.log(
      `Подбор: ${picker.pickers.join(', ') || '—'}; редакций у предложений ${picker.variants}`,
    )
    console.log(`Семейства: ${picker.families.join('; ') || '—'}`)
    console.log(`Без своей страницы: ${picker.noPage.length}`)
    for (const line of picker.missing) console.log(`  не найдено — ${line}`)
  }
  const pickerV2 = await setupPickerV2(payload)
  if (!pickerV2) console.log('Полные конфигурации SCAD Office S392 уже добавлены.')
  else console.log(`SCAD Office, полные конфигурации: ${pickerV2.join('; ') || '—'}`)
  const pickerV3 = await setupPickerV3(payload)
  if (!pickerV3) console.log('Названия в подборе SCAD и AutoCAD уже обновлены.')
  else console.log(`Подбор, понятные названия: ${pickerV3.join('; ') || '—'}`)
  const aliases = await setupSearchAliases(payload)
  if (!aliases) console.log('Другие названия для поиска уже заполнены.')
  else console.log(`Другие названия для поиска: ${aliases.join('; ') || '—'}`)
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
} finally {
  await payload.destroy()
}
