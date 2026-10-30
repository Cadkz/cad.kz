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
// топы продаж по местам и SCAD перед ЛИРОЙ, логотипы производителей для карточек (21.10.2026);
// каталог как в Битриксе: САПР в «Архитектуре и BIM», АВС — лицензия или обновление (22.10.2026);
// оборудование как в Битриксе: четыре типа, плоттеры и комплектующие, WideTEK (22.10.2026);
// тексты сканеров WideTEK (26.10.2026); девять направлений — визуализация и трубопроводы влиты (27.10.2026);
// каталог Autodesk — только коллекции AEC, PDMC, M&E и их программы, Autodesk Forma и линейки, названия Fusion, Navisworks Manage и Simulate, прайс-лист Autodesk для Кадди (29.10.2026); отметка заполненности товаров (при каждом запуске). Выполняется один раз (отметка в журнале
// «Запуски импорта»), при сборке на Vercel вызывается из demo-setup.
// Запуск: pnpm payload run scripts/catalog-setup.mjs

import config from '@payload-config'
import { getPayload } from 'payload'
import { setupAddons } from '../src/lib/addonsSetup.ts'
import { setupArtecScanners } from '../src/lib/artecScannersSetup.ts'
import { setupArtecSoftwareTexts } from '../src/lib/artecSoftwareTextsSetup.ts'
import { setupArtecTexts } from '../src/lib/artecTextsSetup.ts'
import { setupAuditCatalog, setupRevitBack } from '../src/lib/auditCatalogSetup.ts'
import { setupAutodeskCatalog } from '../src/lib/autodeskCatalogSetup.ts'
import { setupAutodeskNames } from '../src/lib/autodeskNamesSetup.ts'
import { setupBimPage } from '../src/lib/bimSetup.ts'
import { setupCardLogos } from '../src/lib/cardLogosSetup.ts'
import { setupCards } from '../src/lib/cardsSetup.ts'
import { setupCatalogSections } from '../src/lib/catalogSetup.ts'
import { setupPopularV2, setupPopularV3 } from '../src/lib/crmHome.ts'
import { setupCrmCatalog } from '../src/lib/crmSetup.ts'
import { setupDemoCleanup } from '../src/lib/demoCleanupSetup.ts'
import {
  setupDirectionsNine,
  setupDirectionsNineV2,
  setupDirectionsOrder,
} from '../src/lib/directionsSetup.ts'
import { setupEquipmentFiltersV2 } from '../src/lib/equipmentFiltersSetup.ts'
import { setupEquipmentPhotos } from '../src/lib/equipmentPhotosSetup.ts'
import { setupEquipmentResearch } from '../src/lib/equipmentResearchSetup.ts'
import { setupEquipment } from '../src/lib/equipmentSetup.ts'
import { setupFamiliesV5 } from '../src/lib/familiesSetup.ts'
import { setupFooterAudit } from '../src/lib/footerSetup.ts'
import { setupFormaCatalog } from '../src/lib/formaCatalogSetup.ts'
import { setupGeo5Catalog } from '../src/lib/geoSetup.ts'
import {
  setupHomeHero,
  setupHomeHeroV2,
  setupHomeTextsAudit,
  setupHomeTrust,
} from '../src/lib/homeSetup.ts'
import { setupKaddiFaq, setupKaddiFaq2 } from '../src/lib/kaddiFaqSetup.ts'
import { setupNewsCovers } from '../src/lib/newsCoversSetup.ts'
import { clearOldPictures } from '../src/lib/oldPicturesSetup.ts'
import { setupOwnerCatalogFixes } from '../src/lib/ownerCatalogFixes.ts'
import { setupOwnerCatalogFixes2, setupOwnerCatalogFixes3 } from '../src/lib/ownerCatalogFixes2.ts'
import { setupOwnerCatalog } from '../src/lib/ownerCatalogSetup.ts'
import { setupPicker, setupPickerV2 } from '../src/lib/pickerSetup.ts'
import { setupPickerV3 } from '../src/lib/pickerSetupV3.ts'
import { setupPickerV4 } from '../src/lib/pickerSetupV4.ts'
import { setupPresets, setupQuality } from '../src/lib/presetsSetup.ts'
import { setupPriorities, setupPrioritiesV2, setupPrioritiesV3 } from '../src/lib/prioritySetup.ts'
import { setupPrivacyPage } from '../src/lib/privacySetup.ts'
import { setupProductTables } from '../src/lib/productTablesSetup.ts'
import { setupProgramTexts } from '../src/lib/programTextsSetup.ts'
import { setupFamilyRenew } from '../src/lib/renewSetup.ts'
import { setupSearchAliases } from '../src/lib/searchSetup.ts'
import { setupSoftwareTexts } from '../src/lib/softwareTextsSetup.ts'
import { setupMepTasks } from '../src/lib/tasksSetup.ts'
import { setupTextsAudit } from '../src/lib/textsSetup.ts'
import { setupVendorList } from '../src/lib/vendorListSetup.ts'
import { setupVendors } from '../src/lib/vendorsSetup.ts'
import { setupVersions } from '../src/lib/versionsSetup.ts'
import { clearWidetekGallery, setupWidetekTexts } from '../src/lib/widetekTextsSetup.ts'

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
  const texts = await setupTextsAudit(payload)
  if (!texts) console.log('Тексты по аудиту уже настроены.')
  else for (const line of texts) console.log(`Тексты по аудиту — ${line}`)
  const priorityV2 = await setupPrioritiesV2(payload)
  if (!priorityV2) console.log('Топы продаж по местам уже расставлены.')
  else for (const line of priorityV2) console.log(line)
  const priorityV3 = await setupPrioritiesV3(payload)
  if (!priorityV3) console.log('Топы продаж дозаполнены.')
  else for (const line of priorityV3) console.log(line)
  const cardLogos = await setupCardLogos(payload)
  if (!cardLogos) console.log('Логотипы производителей для карточек уже поставлены.')
  else for (const line of cardLogos) console.log(line)
  const owner = await setupOwnerCatalog(payload)
  if (!owner) console.log('Каталог по замечаниям 22.10.2026 уже настроен.')
  else for (const line of owner) console.log(line)
  const equipment = await setupEquipment(payload)
  if (!equipment) console.log('Оборудование по замечаниям 22.10.2026 уже настроено.')
  else for (const line of equipment) console.log(`Оборудование — ${line}`)
  const research = await setupEquipmentResearch(payload)
  if (!research) console.log('Исследование оборудования уже загружено.')
  else for (const line of research) console.log(`Исследование — ${line}`)
  const fixes = await setupOwnerCatalogFixes(payload)
  if (!fixes) console.log('Решения владельца по исследованию (23.10.2026) уже применены.')
  else for (const line of fixes) console.log(`Решения владельца — ${line}`)
  const fixes2 = await setupOwnerCatalogFixes2(payload)
  if (!fixes2) console.log('Решения владельца, часть 2 (23.10.2026), уже применены.')
  else for (const line of fixes2) console.log(`Решения владельца 2 — ${line}`)
  const fixes3 = await setupOwnerCatalogFixes3(payload)
  if (!fixes3) console.log('Тексты со старого cad.kz уже возвращены.')
  else for (const line of fixes3) console.log(`Решения владельца 3 — ${line}`)
  const programTexts = await setupProgramTexts(payload)
  if (!programTexts) console.log('Тексты 6 программ от владельца уже загружены.')
  else for (const line of programTexts) console.log(`Тексты программ — ${line}`)
  const photos = await setupEquipmentPhotos(payload)
  if (!photos) console.log('Фото плоттеров Canon уже загружены.')
  else for (const line of photos) console.log(`Фото оборудования — ${line}`)
  const demoCleanup = await setupDemoCleanup(payload)
  if (!demoCleanup) console.log('Старые демокарточки уже удалены.')
  else for (const line of demoCleanup) console.log(`Демокарточки — ${line}`)
  const filtersV2 = await setupEquipmentFiltersV2(payload)
  if (!filtersV2) console.log('Фильтры плоттеров и сканеров (23.10.2026) уже обновлены.')
  else for (const line of filtersV2) console.log(`Фильтры оборудования — ${line}`)
  const artecTexts = await setupArtecTexts(payload)
  if (!artecTexts) console.log('Тексты сканеров Artec (24.10.2026) уже загружены.')
  else for (const line of artecTexts) console.log(`Тексты Artec — ${line}`)
  const artecScanners = await setupArtecScanners(payload)
  if (!artecScanners) console.log('Сканеры Artec (24.10.2026, Point II, Neo, сканы) уже настроены.')
  else for (const line of artecScanners) console.log(`Сканеры Artec — ${line}`)
  const widetekTexts = await setupWidetekTexts(payload)
  if (!widetekTexts) console.log('Тексты сканеров WideTEK (26.10.2026) уже загружены.')
  else for (const line of widetekTexts) console.log(`Тексты WideTEK — ${line}`)
  const widetekGallery = await clearWidetekGallery(payload)
  if (!widetekGallery) console.log('Старые картинки WideTEK уже убраны.')
  else for (const line of widetekGallery) console.log(`Галерея WideTEK — ${line}`)
  const artecSoftware = await setupArtecSoftwareTexts(payload)
  if (!artecSoftware) console.log('Тексты Artec Studio и Artec Cloud (26.10.2026) уже загружены.')
  else for (const line of artecSoftware) console.log(`Тексты программ Artec — ${line}`)
  const software = await setupSoftwareTexts(payload)
  if (!software)
    console.log('Тексты 7 программ из пачки batch-software (26.10.2026) уже загружены.')
  else for (const line of software) console.log(`Тексты программ — ${line}`)
  const oldPictures = await clearOldPictures(payload)
  if (!oldPictures)
    console.log('Старые картинки Битрикса у программ и не-PNG у товаров уже убраны.')
  else for (const line of oldPictures) console.log(`Старые картинки — ${line}`)
  const directions = await setupDirectionsNine(payload)
  if (!directions) console.log('Девять направлений (27.10.2026) уже настроены.')
  else for (const line of directions) console.log(`Направления — ${line}`)
  const directionsV2 = await setupDirectionsNineV2(payload)
  if (!directionsV2) console.log('VRED и Alias уже только в машиностроении.')
  else for (const line of directionsV2) console.log(`Направления 2 — ${line}`)
  const order = await setupDirectionsOrder(payload)
  if (!order) console.log('Порядок направлений (САПР и BIM первыми) уже настроен.')
  else for (const line of order) console.log(`Порядок направлений — ${line}`)
  const autodesk = await setupAutodeskCatalog(payload)
  if (!autodesk) console.log('Каталог Autodesk по коллекциям (29.10.2026) уже настроен.')
  else for (const line of autodesk) console.log(`Каталог Autodesk — ${line}`)
  const forma = await setupFormaCatalog(payload)
  if (!forma) console.log('Autodesk Forma и линейки Autodesk (29.10.2026) уже настроены.')
  else for (const line of forma) console.log(`Autodesk Forma — ${line}`)
  const names = await setupAutodeskNames(payload)
  if (!names)
    console.log('Названия Fusion и Navisworks Manage/Simulate (29.10.2026) уже настроены.')
  else for (const line of names) console.log(`Названия Autodesk — ${line}`)
  const vendorList = await setupVendorList(payload)
  if (!vendorList) console.log('Прайс-лист Autodesk для Кадди уже загружен.')
  else for (const line of vendorList) console.log(`Прайс-лист Autodesk для Кадди — ${line}`)
  const faq = await setupKaddiFaq(payload)
  if (!faq) console.log('Справка Кадди 30.10.2026 уже загружена.')
  else for (const line of faq) console.log(`Справка Кадди — ${line}`)
  const faq2 = await setupKaddiFaq2(payload)
  if (!faq2) console.log('Справка Кадди, второй прогон 30.10.2026, уже загружена.')
  else for (const line of faq2) console.log(`Справка Кадди (2) — ${line}`)
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
