// Разделы каталога по утверждённым направлениям: новые разделы, «Правила разделов»,
// «С этим покупают» у разделов, разделы у товаров; затем приоритет показа (топы продаж первыми);
// затем вторая настройка: дубли производителей, линейки, приложения в конец, темы новостей;
// затем подбор AutoCAD и SCAD Office и семейство сателлитов SCAD; семейства редких товаров;
// другие названия для поиска; актуализация версий по сайтам производителей; продления ПАССАТ
// — кнопкой «Обновить версию»; пакеты и девять задач GEO5 в каталоге; блок «Официальный партнёр» на главной;
// каталог по CRM (САПР и черчение, широкоформат, сценарии покупки, популярные решения);
// дополнения к AutoCAD, Revit, Inventor (Требуется базовое ПО) и AutoCAD LT; политика
// конфиденциальности со старого сайта; таблицы в описаниях товаров со старого сайта; страница «Внедрение BIM»; иллюстрации тем новостей; готовые виды
// списков в админке; разделы по аудиту 21.10.2026 (SCAD Office в BIM, курсы SCAD; Revit из расчёта убран);
// контакты и подвал по аудиту (основной номер, адрес офиса, описание компании);
// отметка заполненности товаров (при каждом запуске). Выполняется один раз (отметка в журнале
// «Запуски импорта»), при сборке на Vercel вызывается из demo-setup.
// Запуск: pnpm payload run scripts/catalog-setup.mjs

import config from '@payload-config'
import { getPayload } from 'payload'
import { setupAddons } from '../src/lib/addonsSetup.ts'
import { setupAuditCatalog, setupRevitBack } from '../src/lib/auditCatalogSetup.ts'
import { setupBimPage } from '../src/lib/bimSetup.ts'
import { setupCards } from '../src/lib/cardsSetup.ts'
import { setupCatalogSections } from '../src/lib/catalogSetup.ts'
import { setupPopularV2, setupPopularV3 } from '../src/lib/crmHome.ts'
import { setupCrmCatalog } from '../src/lib/crmSetup.ts'
import { setupFamiliesV5 } from '../src/lib/familiesSetup.ts'
import { setupFooterAudit } from '../src/lib/footerSetup.ts'
import { setupGeo5Catalog } from '../src/lib/geoSetup.ts'
import {
  setupHomeHero,
  setupHomeHeroV2,
  setupHomeTextsAudit,
  setupHomeTrust,
} from '../src/lib/homeSetup.ts'
import { setupNewsCovers } from '../src/lib/newsCoversSetup.ts'
import { setupPicker, setupPickerV2 } from '../src/lib/pickerSetup.ts'
import { setupPickerV3 } from '../src/lib/pickerSetupV3.ts'
import { setupPickerV4 } from '../src/lib/pickerSetupV4.ts'
import { setupPresets, setupQuality } from '../src/lib/presetsSetup.ts'
import { setupPriorities } from '../src/lib/prioritySetup.ts'
import { setupPrivacyPage } from '../src/lib/privacySetup.ts'
import { setupProductTables } from '../src/lib/productTablesSetup.ts'
import { setupFamilyRenew } from '../src/lib/renewSetup.ts'
import { setupSearchAliases } from '../src/lib/searchSetup.ts'
import { setupMepTasks } from '../src/lib/tasksSetup.ts'
import { setupVendors } from '../src/lib/vendorsSetup.ts'
import { setupVersions } from '../src/lib/versionsSetup.ts'

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
  const pickerV4 = await setupPickerV4(payload)
  if (!pickerV4) console.log('Подбор GEO5, Revit, ЛИРА, АВС, Artec уже настроен.')
  else {
    console.log(`Подбор и семейства: ${pickerV4.done.join('; ') || '—'}`)
    for (const line of pickerV4.missing) console.log(`  не найдено — ${line}`)
  }
  const families = await setupFamiliesV5(payload)
  if (!families) console.log('Семейства редких товаров уже настроены.')
  else {
    console.log(`Семейства: ${families.families.join('; ') || '—'}; товаров ${families.products}`)
    console.log(`Группы без своей страницы: ${families.lines.join('; ') || '—'}`)
    console.log(
      `Варианты на странице программы: ${families.options}; в черновики: ${families.drafts}`,
    )
    for (const line of families.unmatched) console.log(`  без места — ${line}`)
  }
  const aliases = await setupSearchAliases(payload)
  if (!aliases) console.log('Другие названия для поиска уже заполнены.')
  else console.log(`Другие названия для поиска: ${aliases.join('; ') || '—'}`)
  const mepTasks = await setupMepTasks(payload)
  if (!mepTasks) console.log('Задачи инженерных сетей уже проставлены.')
  else console.log(`Задачи инженерных сетей: ${mepTasks.join('; ') || '—'}`)
  const geo5 = await setupGeo5Catalog(payload)
  if (!geo5) console.log('GEO5 в каталоге уже настроен.')
  else for (const line of geo5) console.log(`GEO5 в каталоге — ${line}`)
  const versions = await setupVersions(payload)
  if (!versions) console.log('Версии уже актуализированы.')
  else {
    console.log(`Версии, товары: ${versions.products.join('; ') || '—'}`)
    console.log(`Версии, комплектаций обновлено: ${versions.offers}`)
    console.log(`В черновики: ${versions.drafts.length} ${versions.drafts.join('; ')}`)
    console.log(`Семейства: ${versions.families.join('; ') || '—'}`)
    for (const line of versions.missing) console.log(`  не найдено — ${line}`)
  }
  const renew = await setupFamilyRenew(payload)
  if (!renew) console.log('Продления в семействах уже заменены кнопкой.')
  else {
    console.log(`Кнопка обновления: ${renew.families.join('; ') || '—'}`)
    for (const line of renew.missing) console.log(`  не найдено — семейство ${line}`)
  }
  const cards = await setupCards(payload)
  if (!cards) console.log('Тексты карточек уже почищены.')
  else {
    console.log(`Тексты карточек почищены: ${cards.products.length} товаров`)
    for (const line of cards.products) console.log(`  ${line}`)
    console.log(`Подписи картинок «Revit 20xx» → «Revit»: ${cards.media}`)
  }
  const trust = await setupHomeTrust(payload)
  console.log(trust ?? 'Блок «Официальный партнёр» на главной уже настроен.')
  const hero = await setupHomeHero(payload)
  console.log(hero ?? 'Первый экран «Подбор по задаче» уже настроен.')
  const heroV2 = await setupHomeHeroV2(payload)
  console.log(heroV2 ?? 'Тексты первого экрана (вторая редакция) уже обновлены.')
  const homeTexts = await setupHomeTextsAudit(payload)
  console.log(homeTexts ?? 'Тексты главной по аудиту уже обновлены.')
  const crm = await setupCrmCatalog(payload)
  if (!crm) console.log('Каталог по CRM уже настроен.')
  else for (const line of crm) console.log(`Каталог по CRM — ${line}`)
  const popular = await setupPopularV2(payload)
  if (!popular) console.log('Популярные решения плитками уже настроены.')
  else for (const line of popular) console.log(line)
  const popularV3 = await setupPopularV3(payload)
  if (!popularV3) console.log('Популярные решения по списку владельца уже настроены.')
  else for (const line of popularV3) console.log(line)
  const addons = await setupAddons(payload)
  if (!addons) console.log('Дополнения к AutoCAD, Revit, Inventor уже связаны.')
  else for (const line of addons) console.log(`Дополнения — ${line}`)
  const privacy = await setupPrivacyPage(payload)
  console.log(privacy ?? 'Политика конфиденциальности уже перенесена.')
  const productTables = await setupProductTables(payload)
  if (!productTables) console.log('Таблицы в описаниях товаров уже восстановлены.')
  else {
    console.log(
      `Таблицы в описаниях товаров: проверено ${productTables.checked}, таблиц ${productTables.tables} в ${productTables.updated.length} товарах` +
        (productTables.failed
          ? `; старый сайт не ответил для ${productTables.failed} — повторим при следующей сборке`
          : ''),
    )
    for (const line of productTables.updated) console.log(`  ${line}`)
  }
  const bim = await setupBimPage(payload)
  console.log(bim ?? 'Страница «Внедрение BIM» уже создана.')
  const covers = await setupNewsCovers(payload)
  if (!covers) console.log('Иллюстрации тем новостей уже загружены.')
  else for (const line of covers) console.log(`Иллюстрации тем — ${line}`)
  const audit = await setupAuditCatalog(payload)
  if (!audit) console.log('Разделы по аудиту 21.10.2026 уже настроены.')
  else for (const line of audit) console.log(`Разделы по аудиту — ${line}`)
  const revitBack = await setupRevitBack(payload)
  if (!revitBack) console.log('Revit уже убран из «Расчёта конструкций».')
  else for (const line of revitBack) console.log(`Revit без расчёта — ${line}`)
  const footer = await setupFooterAudit(payload)
  if (!footer) console.log('Контакты и подвал по аудиту уже настроены.')
  else for (const line of footer) console.log(`Подвал по аудиту — ${line}`)
  const presets = await setupPresets(payload)
  if (!presets) console.log('Готовые виды списков уже созданы.')
  else console.log(`Готовые виды списков: ${presets.length}`)
  console.log(`Заполненность товаров: обновлено ${await setupQuality(payload)}`)
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
} finally {
  await payload.destroy()
}
