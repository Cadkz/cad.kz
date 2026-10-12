// @ts-check
/**
 * Каталог по данным CRM (документ «Каталог CAD.kz: приоритеты по CRM», пункты P0, решения владельца
 * 12.10.2026): новый раздел «САПР и черчение», переименования, «Широкоформатная печать
 * и сканирование» из трёх разделов, ПО для сканов в «3D-сканировании», порядок разделов
 * и производителей, сценарии покупки, первое наполнение «Популярных решений». SCAD Office —
 * первым в расчёте (ответ владельца). Дальше всё правится в админке; файл нужен для первой
 * настройки и тестов.
 */

/** Новые разделы. */
export const CRM_NEW_SECTIONS = [
  {
    slug: 'cad',
    title: 'САПР и черчение',
    menuGroup: 'software',
    isDirection: true,
    icon: 'compass',
    tone: 'navy',
    summary:
      'AutoCAD, СПДС GraphiCS, RasterDesk — черчение, оформление по СПДС и работа со сканами.',
  },
  {
    slug: 'wide-format',
    title: 'Широкоформатная печать и сканирование',
    menuGroup: 'hardware',
    isDirection: false,
    icon: 'printer',
    tone: 'navy',
    summary: 'Плоттеры и МФУ Canon, сканеры WideTEK, расходные материалы.',
  },
]

/** Переименования: раздел меняется, только если название не правили в админке. */
/** @type {Record<string, [string, string]>} */
export const CRM_RENAMES = {
  estimate: ['Сметы и документооборот', 'Сметы и нормативные базы'],
  arch: ['Архитектура и строительство', 'Архитектура и BIM'],
  geotech: ['Геотехника и геология', 'Геотехника и основания'],
  pipes: ['Технологические трубопроводы', 'Промышленные объекты и трубопроводы'],
  scanners: ['3D-сканеры', '3D-сканирование'],
  plotters: ['Плоттеры', 'Плоттеры и МФУ'],
}

/** Короткие описания: меняются, только если в разделе стоит первое (демо) описание. */
/** @type {Record<string, [string, string]>} */
export const CRM_SUMMARIES = {
  estimate: [
    'АВС-4 — сметы по казахстанским нормативам.',
    'АВС-KZ и сметно-нормативные базы РК: сметы, обновления баз.',
  ],
  arch: [
    'AutoCAD, Revit — проектирование зданий и BIM-координация.',
    'Revit, AEC Collection, Navisworks — BIM-моделирование и координация.',
  ],
  scanners: [
    'Портативные сканеры для обмеров и реверс-инжиниринга.',
    'Сканеры Artec и программы для обработки сканов. Покажем в работе.',
  ],
}

/** Подразделы «Широкоформатной печати и сканирования». */
export const CRM_PARENTS = {
  plotters: 'wide-format',
  'wide-scanners': 'wide-format',
  consumables: 'wide-format',
}

/** Порядок разделов: первые два закрывают больше половины обращений. */
/** @type {Record<string, number>} */
export const CRM_ORDER = {
  cad: 10,
  estimate: 20,
  arch: 30,
  structural: 40,
  geotech: 50,
  machine: 60,
  infra: 70,
  mep: 80,
  pipes: 90,
  viz: 100,
  scanners: 110,
  'wide-format': 120,
  workstations: 130,
  training: 210,
  consulting: 220,
}

/** Сценарий покупки по умолчанию у разделов. */
/** @type {Record<string, import('./buyScenario.mjs').Scenario>} */
export const CRM_SECTION_SCENARIOS = {
  cad: 'standard',
  estimate: 'standard',
  arch: 'standard',
  structural: 'standard',
  geotech: 'standard',
  viz: 'standard',
  machine: 'corporate',
  infra: 'corporate',
  mep: 'corporate',
  pipes: 'corporate',
  scanners: 'equipment',
  'wide-format': 'equipment',
  workstations: 'equipment',
  training: 'service',
  consulting: 'service',
}

/** Разделы с записью на демонстрацию. */
export const CRM_DEMO_SECTIONS = ['scanners']

/** Производители, которые в разделе первыми (заменяет прежний порядок). SCAD Soft — первым в расчёте. */
/** @type {Record<string, string[]>} */
export const CRM_PINS = {
  cad: ['Autodesk', 'Csoft Development'],
  estimate: ['АВС', 'Autodesk'],
  arch: ['Autodesk', 'Csoft Development', 'ЛИРА-FEM'],
  structural: ['SCAD Soft', 'ЛИРА-FEM', 'Base', 'Autodesk'],
  geotech: ['Fine Software', 'ЛИРА-FEM', 'SCAD Soft', 'Base'],
  machine: ['Autodesk', 'АСКОН', 'Csoft Development', 'Artec 3D'],
  infra: ['Autodesk', 'Csoft Development'],
  mep: ['MagiCAD', 'Autodesk', 'Csoft Development', 'АРС-ПС'],
  pipes: ['Csoft Development', 'НТП Трубопровод'],
  viz: ['Autodesk', 'Chaos Group'],
  scanners: ['Artec 3D', 'Autodesk'],
  'wide-format': ['Canon', 'Image Access'],
}

/** «С этим покупают» у новых разделов. */
/** @type {Record<string, string[]>} */
export const CRM_CROSS = {
  cad: ['training', 'consulting', 'workstations'],
}

/**
 * Новые правила разделов. Встают перед прежними (после «Снят с продажи»): первое подходящее
 * правило побеждает, поэтому AutoCAD уходит из «Архитектуры» в «САПР и черчение», а TDMS
 * и CADLib — из «Смет» в «Архитектуру и BIM». Слова — как в админке: запятая — любое,
 * «+» — все части. Fusion и MotionBuilder стоят раньше Build, иначе «Additive Build Extension»
 * и «MotionBuilder» ушли бы в BIM.
 * @type {{ title: string, vendor: string | null, kind: string | null, words: string,
 *   main: string, extra: string[] }[]}
 */
export const CRM_RULES = [
  {
    title: 'TDMS, StdManagerCS, CADLib — Архитектура и BIM',
    vendor: null,
    kind: 'software',
    words: 'tdms, stdmanager, cadlib',
    main: 'arch',
    extra: [],
  },
  {
    title: 'AutoCAD Revit LT Suite',
    vendor: 'Autodesk',
    kind: 'software',
    words: 'autocad revit lt suite',
    main: 'arch',
    extra: ['cad'],
  },
  {
    title: 'AutoCAD — САПР и черчение',
    vendor: 'Autodesk',
    kind: 'software',
    words: 'autocad',
    main: 'cad',
    extra: ['arch', 'machine'],
  },
  {
    title: 'nanoCAD — САПР и черчение',
    vendor: null,
    kind: 'software',
    words: 'nanocad',
    main: 'cad',
    extra: ['arch'],
  },
  {
    title: 'СПДС Железобетон и Металлоконструкции',
    vendor: null,
    kind: 'software',
    words: 'спдс+железобетон, спдс+металло',
    main: 'cad',
    extra: ['structural', 'arch'],
  },
  {
    title: 'СПДС GraphiCS и Стройплощадка',
    vendor: null,
    kind: 'software',
    words: 'спдс',
    main: 'cad',
    extra: ['arch'],
  },
  {
    title: 'RasterDesk, RasterID, SpotLight — работа со сканами чертежей',
    vendor: null,
    kind: 'software',
    words: 'rasterdesk, rasterid, spotlight',
    main: 'cad',
    extra: [],
  },
  {
    title: 'Fusion — Машиностроение',
    vendor: 'Autodesk',
    kind: 'software',
    words: 'fusion',
    main: 'machine',
    extra: [],
  },
  {
    title: 'Vault, Upchain — Машиностроение',
    vendor: 'Autodesk',
    kind: 'software',
    words: 'vault, upchain',
    main: 'machine',
    extra: [],
  },
  {
    // Защищает MotionBuilder от слова «build» в следующем правиле.
    title: 'MotionBuilder — Визуализация',
    vendor: 'Autodesk',
    kind: 'software',
    words: 'motionbuilder',
    main: 'viz',
    extra: [],
  },
  {
    title: 'Autodesk Docs, BIM Collaborate, Build, Assemble — Архитектура и BIM',
    vendor: 'Autodesk',
    kind: 'software',
    words: 'docs, collaborate, build, assemble',
    main: 'arch',
    extra: [],
  },
  {
    title: 'ReCap Pro — 3D-сканирование',
    vendor: 'Autodesk',
    kind: 'software',
    words: 'recap',
    main: 'scanners',
    extra: ['arch'],
  },
  {
    title: 'Geomagic — 3D-сканирование',
    vendor: null,
    kind: null,
    words: 'geomagic',
    main: 'scanners',
    extra: ['machine'],
  },
]

/**
 * Сценарий у товаров, если он не выбран: первое подходящее правило. Продления и подписки —
 * «Продлить», дорогие системы Autodesk и CSoft — подбор и КП, библиотеки КОМПАС — корзина.
 * @type {{ vendor: string | null, title: RegExp | null, scenario: import('./buyScenario.mjs').Scenario }[]}
 */
export const CRM_PRODUCT_SCENARIOS = [
  {
    vendor: null,
    title: /subscription|подписка на обновления|^обновление для|upgrade|льготн/i,
    scenario: 'renewal',
  },
  { vendor: null, title: /сметно.?норматив|рснб|рнсб/i, scenario: 'renewal' },
  {
    vendor: 'Autodesk',
    title:
      /architecture engineering|navisworks|inventor|fusion|vault|upchain|\bdocs\b|collaborate|^build$|bim 360|assemble/i,
    scenario: 'corporate',
  },
  { vendor: 'Csoft Development', title: /model studio|cadlib|tdms/i, scenario: 'corporate' },
  { vendor: 'TDMS Фарватер', title: null, scenario: 'corporate' },
  { vendor: 'АСКОН', title: null, scenario: 'standard' },
]

/**
 * Сценарий товара по правилам или null.
 * @param {{ title: string, vendor: string | null }} product
 */
export function seedScenario(product) {
  const rule = CRM_PRODUCT_SCENARIOS.find(
    (item) =>
      (item.vendor === null || item.vendor === product.vendor) &&
      (item.title === null || item.title.test(product.title.trim())),
  )
  return rule?.scenario ?? null
}

/** Уровень показа у производителей (только если сейчас «Обычный»). */
/** @type {Record<string, 'top'>} */
export const CRM_VENDOR_LEVELS = { MagiCAD: 'top' }

/**
 * Уровень показа у товаров, если он не выбран: порядок внутри разделов из документа (раздел 6).
 * @type {{ vendor: string | null, title: RegExp, level: 'flagship' | 'top' }[]}
 */
export const CRM_PRODUCT_LEVELS = [
  { vendor: 'Autodesk', title: /^Inventor Professional$/i, level: 'flagship' },
  { vendor: 'Autodesk', title: /^Architecture Engineering/i, level: 'top' },
  { vendor: 'Autodesk', title: /^Navisworks/i, level: 'top' },
  { vendor: 'Autodesk', title: /^Fusion 360 (Team|CLOUD)$/i, level: 'top' },
  { vendor: 'Autodesk', title: /^Vault$/i, level: 'top' },
  { vendor: 'Autodesk', title: /^Civil 3D/i, level: 'top' },
  { vendor: null, title: /^nanoCAD/i, level: 'top' },
]

/**
 * Уровень товара по правилам или null.
 * @param {{ title: string, vendor: string | null }} product
 */
export function seedProductLevel(product) {
  const rule = CRM_PRODUCT_LEVELS.find(
    (item) =>
      (item.vendor === null || item.vendor === product.vendor) && item.title.test(product.title),
  )
  return rule?.level ?? null
}

/**
 * «Популярные решения» — компактные плитки (логотип и название) вместо блока партнёров (замечание
 * владельца 12.10.2026: меньше шума). Порядок владельца: AutoCAD, АВС-KZ (ребрендинг АВС-4),
 * Revit и AEC, SCAD, ЛИРА, GEO5, Inventor и Fusion, сканеры Artec. Плитка из двух продуктов ведёт
 * в каталог с их производителем и разделом, а не на один товар; товар нужен для логотипа.
 * Товар ищется по адресу, затем по началу названия.
 * @type {{ slug: string | null, title: RegExp | null, label: string, href: string | null }[]}
 */
export const CRM_POPULAR = [
  { slug: 'autocad', title: /^AutoCAD$/i, label: 'AutoCAD и AutoCAD LT', href: null },
  { slug: null, title: /^(Программный комплекс АВС|АВС-4)/i, label: 'АВС-KZ', href: null },
  {
    slug: 'autodesk-revit',
    title: /^Revit$/i,
    label: 'Revit и AEC Collection',
    href: '/catalog?direction=arch&vendor=Autodesk',
  },
  { slug: 'scad_v23', title: /^SCAD Office/i, label: 'SCAD Office', href: null },
  { slug: null, title: /^ЛИРА\s*-\s*FEM/i, label: 'ЛИРА-FEM', href: null },
  { slug: 'geo5', title: /^GEO5$/i, label: 'GEO5', href: null },
  {
    slug: 'inventor_professional',
    title: /^Inventor Professional$/i,
    label: 'Inventor и Fusion',
    href: '/catalog?direction=machine&vendor=Autodesk',
  },
  {
    slug: null,
    title: /^Artec Leo$/i,
    label: 'Сканеры Artec',
    href: '/catalog?group=hardware&type=scanners&vendor=Artec+3D',
  },
]

/** Описание «Смет» из первой настройки: АВС-4 → АВС-KZ (ребрендинг, замечание владельца). */
export const ESTIMATE_SUMMARY_FIX = [
  'АВС-4 и сметно-нормативные базы РК: сметы, обновления баз.',
  'АВС-KZ и сметно-нормативные базы РК: сметы, обновления баз.',
]

/** Названия первого наполнения (12.10.2026, утро): блок с ними не правили — его можно заменить. */
export const CRM_POPULAR_V1_LABELS = [
  'AutoCAD и AutoCAD LT',
  'АВС-4 и нормативные базы',
  'Revit и AEC Collection',
  'SCAD Office',
  'ЛИРА-FEM',
  'GEO5',
  'Сканеры Artec',
  'Inventor и Fusion',
]

/** Полоса «Продление лицензий» на главной. */
export const CRM_RENEW_BAND = {
  title: 'Продление лицензий',
  text: 'Выберите программу, укажите номер лицензии и число мест — менеджер пришлёт счёт на продление.',
}

/**
 * Порядок правил после вставки новых: новые встают сразу за правилами «Снят с продажи», прежние
 * сохраняют порядок между собой. Если между ними не хватает места, прежние сдвигаются.
 * @param {{ id: number, order: number, retire: boolean }[]} rules прежние правила
 * @param {number} count сколько новых правил
 * @returns {{ shift: number, after: number, starts: number[] }} на сколько сдвинуть правила
 *   с порядком больше `after` и какие номера дать новым
 */
export function planRuleOrder(rules, count) {
  const retired = rules.filter((rule) => rule.retire).map((rule) => rule.order)
  const after = retired.length ? Math.max(...retired) : 0
  const later = rules.filter((rule) => rule.order > after).map((rule) => rule.order)
  const next = later.length ? Math.min(...later) : after + 10 * (count + 1)
  const step = 10
  const need = after + step * (count + 1)
  const shift = next >= need ? 0 : need - next
  return { shift, after, starts: Array.from({ length: count }, (_, i) => after + step * (i + 1)) }
}
