// Черновик привязки товаров к направлениям и разделам нового каталога.
// Правила читаются сверху вниз, срабатывает первое подходящее: производитель, тип товара
// и слова в названии. Владелец проверяет группы на странице-таблице, его правки потом
// применяются поверх этих правил. Разделы — slug из коллекции «Разделы»; NEW_SECTIONS —
// разделы, которых на сайте ещё нет (предложение, создаются только после согласия владельца).
// exceptions — отдельные товары группы с другими разделами (09.10.2026, по сверке с ответами
// ChatGPT): срабатывает первое подходящее исключение, иначе разделы группы. Пустой список
// разделов — товар без направления (виден через поиск и производителя).

/** Разделы, которых пока нет на сайте. */
export const NEW_SECTIONS = {
  'wide-scanners': { title: 'Широкоформатные сканеры', menuGroup: 'hardware' },
  consumables: { title: 'Расходные материалы', menuGroup: 'hardware' },
  workstations: { title: 'Рабочие станции', menuGroup: 'hardware' },
  consulting: { title: 'Внедрение и консалтинг', menuGroup: 'service' },
}

/**
 * @typedef {{ label: string, title: RegExp, sections: string[] }} DirectionException
 * @typedef {{ key: string, label: string, vendor?: string, kind?: string, title?: RegExp,
 *   sections: string[], exceptions?: DirectionException[], note?: string }} DirectionRule
 */

const AD = 'Autodesk'
const CS = 'Csoft Development'
const NTP = 'НТП Трубопровод'

/** @type {DirectionRule[]} */
export const DIRECTION_RULES = [
  // Оборудование
  {
    key: 'artec',
    label: 'Artec: сканеры, Studio, Cloud, метрология',
    vendor: 'Artec 3D',
    sections: ['scanners'],
    exceptions: [
      { label: 'Artec Studio', title: /artec studio/i, sections: ['scanners', 'machine'] },
    ],
  },
  {
    key: 'widetek',
    label: 'Image Access WideTEK — широкоформатные сканеры',
    vendor: 'Image Access',
    sections: ['wide-scanners'],
  },
  {
    key: 'canon-supplies',
    label: 'Canon: тонеры и картриджи',
    vendor: 'Canon',
    title: /тонер|картридж/i,
    sections: ['consumables'],
  },
  { key: 'canon', label: 'Canon: плоттеры и МФУ', vendor: 'Canon', sections: ['plotters'] },
  {
    key: 'workstations',
    label: 'Графические станции Iridium',
    kind: 'hardware',
    title: /графическая станция/i,
    sections: ['workstations'],
  },
  // Курсы и услуги
  {
    key: 'askon',
    label: 'АСКОН: справочники и библиотеки КОМПАС',
    vendor: 'АСКОН',
    sections: ['machine'],
    note: 'В Битриксе отмечены как «Курс», по сути это ПО — тип стоит исправить.',
  },
  {
    key: 'course-infra',
    label: 'Курсы Civil 3D и Subassembly Composer',
    kind: 'course',
    title: /civil|subassembly/i,
    sections: ['training', 'infra'],
    exceptions: [
      { label: 'Civil 3D: наружные сети', title: /наружн/i, sections: ['training', 'mep'] },
      {
        label: 'Civil 3D: геодезия и геология',
        title: /геодез|геолог/i,
        sections: ['training', 'geotech'],
      },
    ],
  },
  {
    key: 'course-structural',
    label: 'Курсы по расчёту (ЛИРА, Robot, еврокоды, Advance Steel)',
    kind: 'course',
    title: /lira|лира|robot|еврокод|advance steel/i,
    sections: ['training', 'structural'],
  },
  {
    key: 'course-mep',
    label: 'Курс Revit MEP',
    kind: 'course',
    title: /mep/i,
    sections: ['training', 'mep'],
  },
  {
    key: 'course-arch',
    label: 'Курсы Revit и BIM',
    kind: 'course',
    title: /revit|bim/i,
    sections: ['training', 'arch'],
  },
  {
    key: 'course-pipes',
    label: 'Курс Model Studio CS Трубопроводы',
    kind: 'course',
    title: /трубопровод/i,
    sections: ['training', 'pipes'],
  },
  {
    key: 'course-viz',
    label: 'Курс визуализации 3ds Max + V-Ray',
    kind: 'course',
    title: /3ds|v.?ray/i,
    sections: ['training', 'viz'],
  },
  { key: 'course-other', label: 'Прочие курсы', kind: 'course', sections: ['training'] },
  {
    key: 'service-training',
    label: 'Корпоративное обучение',
    kind: 'service',
    title: /обучени/i,
    sections: ['training'],
  },
  {
    key: 'service-consulting',
    label: 'Консалтинг и внедрение BIM',
    kind: 'service',
    sections: ['consulting'],
  },
  // Расчёт конструкций и геотехника
  {
    key: 'geo5',
    label: 'GEO5 — все программы и модули',
    vendor: 'Fine Software',
    title: /geo5/i,
    sections: ['geotech'],
  },
  {
    key: 'fine-structural',
    label: 'Fine: TRUSS4, FIN EC',
    vendor: 'Fine Software',
    sections: ['structural'],
  },
  {
    key: 'scad-soil',
    label: 'SCAD: ЗАПРОС, КРОСС, ОТКОС (основания и грунт)',
    vendor: 'SCAD',
    title: /запрос|кросс|откос/i,
    sections: ['geotech', 'structural'],
    exceptions: [{ label: 'ОТКОС', title: /откос/i, sections: ['geotech'] }],
  },
  {
    key: 'scad',
    label: 'SCAD Office и программы-сателлиты',
    vendor: 'SCAD',
    sections: ['structural'],
  },
  {
    key: 'lira-soil',
    label: 'ЛИРА: ГРУНТ, ЭСПРИ Грунт, Основания, Шпунт',
    vendor: 'ЛИРА-FEM',
    title: /грунт|основани|шпунт/i,
    sections: ['geotech', 'structural'],
  },
  {
    key: 'lira-sapfir',
    label: 'ЛИРА: САПФИР 3D и Генератор',
    vendor: 'ЛИРА-FEM',
    title: /сапфир 3d|сапфир генератор/i,
    sections: ['arch', 'structural'],
  },
  {
    key: 'lira',
    label: 'ЛИРА-FEM, МОНОМАХ, ЭСПРИ, модули',
    vendor: 'ЛИРА-FEM',
    sections: ['structural'],
    exceptions: [
      { label: 'САПФИР-ЖБК', title: /сапфир.{0,3}жбк/i, sections: ['structural', 'arch'] },
    ],
  },
  {
    key: 'base-foundation',
    label: 'Base: фундаменты',
    vendor: 'Base',
    title: /фундамент/i,
    sections: ['structural', 'geotech'],
  },
  {
    key: 'base',
    label: 'Base: прочие программы и ключи',
    vendor: 'Base',
    sections: ['structural'],
    exceptions: [
      { label: 'Блок расчётов архитектора', title: /архитектор/i, sections: ['arch'] },
      { label: 'Блок специальных расчётов', title: /специальн/i, sections: ['mep', 'arch'] },
    ],
  },
  // Инженерные сети, трубопроводы, сметы, визуализация
  { key: 'magicad', label: 'MagiCAD для AutoCAD и Revit', vendor: 'MagiCAD', sections: ['mep'] },
  {
    key: 'ars',
    label: 'АРС-ПС: сантехнические и теплотехнические расчёты',
    vendor: 'АРС-ПС',
    sections: ['mep'],
  },
  {
    key: 'ntp',
    label: 'НТП Трубопровод: СТАРТ, ПАССАТ, Изоляция, Гидросистема, БД',
    vendor: NTP,
    sections: ['pipes'],
    exceptions: [
      { label: 'ПАССАТ, Штуцер-МКЭ', title: /пассат|штуцер/i, sections: ['pipes', 'machine'] },
      {
        label: 'СТАРТ-Проф, Гидросистема, Изоляция',
        title: /старт|гидросистем|изоляц/i,
        sections: ['pipes', 'mep'],
      },
    ],
  },
  {
    key: 'avs',
    label: 'АВС: сметы и сметно-нормативные базы',
    vendor: 'АВС',
    sections: ['estimate'],
    exceptions: [{ label: 'АККОРД', title: /аккорд/i, sections: ['arch'] }],
  },
  {
    key: 'chaos',
    label: 'Chaos: V-Ray, Phoenix FD, VRScans, Pdplayer',
    vendor: 'Chaos Group',
    sections: ['viz'],
  },
  { key: 'farvater', label: 'TDMS Фарватер', vendor: 'TDMS Фарватер', sections: ['estimate'] },
  // Csoft Development
  {
    key: 'cs-docs',
    label: 'Csoft: TDMS, StdManagerCS, CADLib (документооборот)',
    vendor: CS,
    title: /tdms|stdmanager|cadlib/i,
    sections: ['estimate'],
    exceptions: [
      { label: 'CADLib Модель и Архив', title: /cadlib/i, sections: ['estimate', 'arch'] },
    ],
  },
  {
    key: 'cs-raster',
    label: 'Csoft: RasterDesk, RasterID, SpotLight (сканы чертежей)',
    vendor: CS,
    title: /raster|spotlight/i,
    sections: ['estimate'],
    note: 'Оцифровка бумажного архива. Можно и в «Архитектуру».',
  },
  {
    key: 'cs-spds-structural',
    label: 'СПДС Железобетон и Металлоконструкции',
    vendor: CS,
    title: /спдс (железобетон|металло)/i,
    sections: ['arch', 'structural'],
  },
  {
    key: 'cs-spds',
    label: 'СПДС GraphiCS и Стройплощадка',
    vendor: CS,
    title: /спдс/i,
    sections: ['arch'],
  },
  {
    key: 'cs-psc-foundation',
    label: 'Project Studio CS Фундаменты',
    vendor: CS,
    title: /project studio.*фундамент/i,
    sections: ['structural', 'geotech'],
  },
  {
    key: 'cs-psc-structural',
    label: 'Project Studio CS Конструкции',
    vendor: CS,
    title: /project studio.*конструкц/i,
    sections: ['arch', 'structural'],
  },
  {
    key: 'cs-psc-arch',
    label: 'Project Studio CS Архитектура',
    vendor: CS,
    title: /project studio/i,
    sections: ['arch'],
  },
  {
    key: 'cs-ms-pipes',
    label: 'Model Studio CS Трубопроводы и Технологические схемы',
    vendor: CS,
    title: /model studio.*(трубопровод|технологическ)/i,
    sections: ['pipes'],
    exceptions: [
      { label: 'Model Studio CS Трубопроводы', title: /трубопровод/i, sections: ['pipes', 'mep'] },
    ],
  },
  {
    key: 'cs-ms-arch',
    label: 'Model Studio CS Строительные решения',
    vendor: CS,
    title: /model studio.*строительн/i,
    sections: ['arch'],
  },
  {
    key: 'cs-ms-infra',
    label: 'Model Studio CS Генплан',
    vendor: CS,
    title: /model studio.*генплан/i,
    sections: ['infra'],
  },
  {
    key: 'cs-ms-corp',
    label: 'Model Studio CS Корпоративная лицензия',
    vendor: CS,
    title: /model studio.*корпоратив/i,
    sections: ['pipes', 'mep'],
  },
  {
    key: 'cs-ms-mep',
    label: 'Model Studio CS: сети, электрика, ЛЭП, ОПС, щиты',
    vendor: CS,
    title: /model studio/i,
    sections: ['mep'],
  },
  {
    key: 'cs-electro',
    label: 'Csoft: ElectriCS, EnergyCS, AutomatiCS',
    vendor: CS,
    title: /electrics|energycs|automatics/i,
    sections: ['mep'],
    exceptions: [{ label: 'ElectriCS PRO', title: /electrics pro/i, sections: ['mep', 'machine'] }],
  },
  {
    key: 'cs-machine',
    label: 'Csoft: MechaniCS, ПолигонСофт, TechnologiCS',
    vendor: CS,
    title: /mechanics|полигонсофт|technologics/i,
    sections: ['machine'],
    exceptions: [
      {
        label: 'MechaniCS Оборудование',
        title: /mechanics.{0,3}оборудован/i,
        sections: ['machine', 'pipes'],
      },
    ],
  },
  {
    key: 'cs-infra',
    label: 'Csoft: GeoniCS, PlanTracer, GisEngine, EnerGuide, MapGuide',
    vendor: CS,
    title: /geonics|plantracer|gisengine|energuide|mapguide/i,
    sections: ['infra'],
    exceptions: [{ label: 'CS EnerGuide', title: /energuide/i, sections: ['mep'] }],
  },
  // Autodesk
  {
    key: 'ad-infra',
    label: 'Autodesk: Civil 3D, InfraWorks',
    vendor: AD,
    title: /civil|infraworks/i,
    sections: ['infra'],
    exceptions: [{ label: 'Civil 3D', title: /civil/i, sections: ['infra', 'mep'] }],
  },
  {
    key: 'ad-structural',
    label: 'Autodesk: Advance Steel',
    vendor: AD,
    title: /advance steel/i,
    sections: ['arch', 'structural'],
  },
  {
    key: 'ad-estimate',
    label: 'Autodesk: Takeoff',
    vendor: AD,
    title: /takeoff/i,
    sections: ['estimate'],
  },
  {
    key: 'ad-viz-design',
    label: 'Autodesk: VRED, Alias (промдизайн)',
    vendor: AD,
    title: /vred|alias/i,
    sections: ['machine', 'viz'],
    exceptions: [{ label: 'VRED', title: /vred/i, sections: ['viz', 'machine'] }],
  },
  {
    key: 'ad-viz',
    label: 'Autodesk: 3ds Max, Maya, Arnold, Flame и медиа',
    vendor: AD,
    title:
      /3ds max|maya|arnold|mudbox|motionbuilder|media|flame|flare|lustre|smoke|character|sketchbook/i,
    sections: ['viz'],
  },
  {
    key: 'ad-machine',
    label: 'Autodesk: Inventor, Fusion, Vault, Moldflow, Netfabb и др.',
    vendor: AD,
    title:
      /inventor|fusion|vault|upchain|power|netfabb|moldflow|camplete|trunest|trucomposites|helius|product design|cfd|within/i,
    sections: ['machine'],
    exceptions: [
      {
        label: 'Vault, Vault PLM, Upchain',
        title: /vault|upchain/i,
        sections: ['machine', 'estimate'],
      },
      { label: 'Autodesk CFD', title: /cfd/i, sections: ['machine', 'mep'] },
    ],
  },
  {
    key: 'ad-mep',
    label: 'Autodesk: Fabrication CAMduct',
    vendor: AD,
    title: /fabrication camduct/i,
    sections: ['mep'],
  },
  {
    key: 'ad-premium',
    label: 'Autodesk Premium (план подписки на любые продукты)',
    vendor: AD,
    title: /premium sub/i,
    sections: [],
    note: 'Не программа, а тариф поддержки Autodesk: без направления, находится через поиск.',
  },
  {
    key: 'ad-bim',
    label: 'Autodesk: Revit, AutoCAD, AEC Collection, Navisworks, BIM 360, Docs',
    vendor: AD,
    title:
      /revit|autocad|architecture engineering|navisworks|bim|docs|build|assemble|point layout|recap/i,
    sections: ['arch'],
    exceptions: [
      { label: 'Docs, Assemble', title: /\bdocs\b|assemble/i, sections: ['estimate'] },
      {
        label: 'BIM Collaborate, BIM 360 Build, Build',
        title: /collaborate|\bbuild\b/i,
        sections: ['arch', 'estimate'],
      },
      { label: 'ReCap Pro', title: /recap/i, sections: ['arch', 'scanners'] },
      { label: 'Revit', title: /revit/i, sections: ['arch', 'mep'] },
      {
        label: 'AEC Collection',
        title: /architecture engineering|aec/i,
        sections: ['arch', 'infra'],
      },
      { label: 'AutoCAD', title: /autocad/i, sections: ['arch', 'machine'] },
    ],
  },
]

/**
 * Правило для товара или null, если ни одно не подошло.
 * @param {{ title: string, kind: string, vendor: string }} product
 * @returns {DirectionRule | null}
 */
export function directionRule(product) {
  return (
    DIRECTION_RULES.find(
      (rule) =>
        (!rule.vendor || rule.vendor === product.vendor) &&
        (!rule.kind || rule.kind === product.kind) &&
        (!rule.title || rule.title.test(product.title)),
    ) ?? null
  )
}

/**
 * Разделы товара: исключение внутри группы или разделы группы. null — ни одно правило не подошло.
 * @param {{ title: string, kind: string, vendor: string }} product
 * @returns {string[] | null}
 */
export function directionSections(product) {
  const rule = directionRule(product)
  if (!rule) return null
  const exception = rule.exceptions?.find((item) => item.title.test(product.title))
  return [...(exception ?? rule).sections]
}
