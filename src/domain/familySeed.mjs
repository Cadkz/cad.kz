// Семейства редких товаров CSoft, MagiCAD, НТП Трубопровод, Chaos и АСКОН: правила раскладки
// по названиям (черновик 10.10.2026, на проверке у владельца). Товар попадает в первое подходящее
// семейство по порядку списка, получает линейку и вид «Без своей страницы»: в каталоге и меню
// вместо него одна карточка семейства, старый адрес ведёт на его строку в семействе.
// Продления, обновления с прежних версий, подписки и пакеты лицензий идут в конец семейства
// (порядок от EXTRA_ORDER) и показываются свёрнутым блоком.

/** Порядок в линейке, с которого товар считается продлением, обновлением или пакетом. */
export const EXTRA_ORDER = 100

/** Продление, обновление, подписка на обновления, пакеты и учебные пакеты лицензий. */
export const EXTRA_TITLE =
  /subscri(?:p|b)tion|подписка на обновления|upgrade|льготный период|продление ТП|восстановление ТП|перевод локального|academic licenses|cloud credits|dongle|доп\. мест/i

/**
 * @typedef {{
 *   vendor: string, slug: string, title: string, intro: string,
 *   match: RegExp, except?: RegExp,
 * }} FamilySeed
 */

const intro = (/** @type {string} */ what) =>
  `${what} Отметьте нужное — менеджер пришлёт коммерческое предложение.`

/** @type {FamilySeed[]} */
export const FAMILIES = [
  // CSoft Development
  {
    vendor: 'Csoft Development',
    slug: 'model-studio-cs',
    title: 'Model Studio CS и CADLib',
    intro: intro(
      'Трёхмерное проектирование промышленных объектов по разделам: трубопроводы, электрика, ' +
        'ОВ, ВК, строительные решения, генплан; CADLib — общая модель и архив проекта.',
    ),
    match: /Model Studio CS|CADLib/i,
  },
  {
    vendor: 'Csoft Development',
    slug: 'electrics',
    title: 'ElectriCS',
    intro: intro('Проектирование электрооборудования, схем и кабельных журналов.'),
    match: /ElectriCS/i,
  },
  {
    vendor: 'Csoft Development',
    slug: 'energycs',
    title: 'EnergyCS',
    intro: intro('Расчёты электрических сетей: режимы, потери, токи короткого замыкания, ЛЭП.'),
    match: /EnergyCS/i,
  },
  {
    vendor: 'Csoft Development',
    slug: 'automatics',
    title: 'AutomatiCS',
    intro: intro('Проектирование систем автоматизации и КИП.'),
    match: /AutomatiCS/i,
  },
  {
    vendor: 'Csoft Development',
    slug: 'project-studio-cs',
    title: 'Project Studio CS',
    intro: intro('Архитектура, конструкции и фундаменты в среде AutoCAD.'),
    match: /Project Studio CS/i,
  },
  {
    vendor: 'Csoft Development',
    slug: 'spds',
    title: 'СПДС',
    intro: intro(
      'Оформление чертежей по СПДС: GraphiCS, металлоконструкции, железобетон, стройплощадка.',
    ),
    match: /СПДС/i,
  },
  {
    vendor: 'Csoft Development',
    slug: 'rasterdesk-spotlight',
    title: 'RasterDesk и Spotlight',
    intro: intro('Работа со сканами чертежей: правка растра, векторизация, распознавание.'),
    match: /RasterDesk|RasterID|SpotLight/i,
  },
  {
    vendor: 'Csoft Development',
    slug: 'plantracer',
    title: 'PlanTracer',
    intro: intro('Технические и межевые планы, обмерные чертежи.'),
    match: /PlanTracer/i,
  },
  {
    vendor: 'Csoft Development',
    slug: 'geonics',
    title: 'GeoniCS',
    intro: intro('Изыскания, генплан и инженерная подготовка территории.'),
    match: /GeoniCS/i,
  },
  {
    vendor: 'Csoft Development',
    slug: 'mechanics',
    title: 'MechaniCS',
    intro: intro('Машиностроительное проектирование и оборудование в AutoCAD и Inventor.'),
    match: /MechaniCS/i,
  },
  {
    vendor: 'Csoft Development',
    slug: 'tdms',
    title: 'TDMS',
    intro: intro('Электронный архив и документооборот проектной организации.'),
    match: /TDMS/i,
  },
  {
    vendor: 'Csoft Development',
    slug: 'technologics',
    title: 'TechnologiCS',
    intro: intro('Управление инженерными данными и производством.'),
    match: /TechnologiCS/i,
  },
  {
    vendor: 'Csoft Development',
    slug: 'poligonsoft',
    title: 'ПолигонСофт',
    intro: intro('Моделирование литейных процессов.'),
    match: /ПолигонСофт/i,
  },
  {
    vendor: 'Csoft Development',
    slug: 'stdmanagercs',
    title: 'StdManagerCS',
    intro: intro('Справочник стандартов и нормативов предприятия.'),
    match: /StdManagerCS/i,
  },
  {
    vendor: 'Csoft Development',
    slug: 'cs-gisengine',
    title: 'CS GisEngine',
    intro: intro('ГИС-платформа и провайдер данных для Autodesk MapGuide.'),
    match: /GisEngine|MapGuide/i,
  },
  {
    vendor: 'Csoft Development',
    slug: 'cs-energuide',
    title: 'CS EnerGuide',
    intro: intro('Сетевые лицензии CS EnerGuide.'),
    match: /EnerGuide/i,
  },
  // MagiCAD
  {
    vendor: 'MagiCAD',
    slug: 'magicad-revit',
    title: 'MagiCAD для Revit',
    intro: intro('Инженерные системы в Revit: вентиляция, трубопроводы, электрика, спринклеры.'),
    match: /для Revit/i,
  },
  {
    vendor: 'MagiCAD',
    slug: 'magicad-suite',
    title: 'MagiCAD Suite',
    intro: intro('Наборы MagiCAD по разделам.'),
    match: /MagiCAD Suite/i,
  },
  {
    vendor: 'MagiCAD',
    slug: 'magicad-autocad',
    title: 'MagiCAD для AutoCAD',
    intro: intro('Инженерные системы в AutoCAD: вентиляция, трубопроводы, электрика, спринклеры.'),
    match: /MagiCAD/i,
  },
  // НТП Трубопровод
  {
    vendor: 'НТП Трубопровод',
    slug: 'ntp-revit',
    title: 'Программы НТП для Revit',
    intro: intro('СТАРТ, Изоляция и Гидросистема в Revit.'),
    match: /^(?:Программное обеспечение )?Revit\s*-/i,
  },
  {
    vendor: 'НТП Трубопровод',
    slug: 'start',
    title: 'СТАРТ',
    intro: intro('Прочность и жёсткость трубопроводов: основа СТАРТ-Проф и дополнительные модули.'),
    match: /^СТАРТ/,
  },
  {
    vendor: 'НТП Трубопровод',
    slug: 'passat',
    title: 'ПАССАТ и Штуцер-МКЭ',
    intro: intro('Прочность сосудов и аппаратов: колонны, теплообменники, резервуары, штуцеры.'),
    match: /ПАССАТ|Штуцер/i,
  },
  {
    vendor: 'НТП Трубопровод',
    slug: 'gidrosistema',
    title: 'Гидросистема',
    intro: intro('Гидравлические и тепловые расчёты трубопроводов, гидроудар.'),
    match: /Гидросистема/i,
  },
  {
    vendor: 'НТП Трубопровод',
    slug: 'izolyatsiya',
    title: 'Изоляция',
    intro: intro(
      'Расчёт тепловой изоляции трубопроводов и оборудования, типовая серия 7.903.9-8.15.',
    ),
    match: /Изоляция|7\.903\.9/i,
  },
  {
    vendor: 'НТП Трубопровод',
    slug: 'predklapan',
    title: 'Предклапан',
    intro: intro('Подбор и расчёт предохранительных клапанов.'),
    match: /Предклапан/i,
  },
  {
    vendor: 'НТП Трубопровод',
    slug: 'ntp-databases',
    title: 'Базы данных: УБД, ГК, БДТП',
    intro: intro(
      'Универсальная база данных, генератор классов и база данных текущего проекта (смета, КИП).',
    ),
    match: /УБД|Генератор классов|БДТП/i,
  },
  // Chaos
  {
    vendor: 'Chaos Group',
    slug: 'chaos-education',
    title: 'Chaos для учебных заведений',
    intro: intro('Учебные лицензии V-Ray и Phoenix FD для студентов, преподавателей и классов.'),
    match: /студентов|Academic licenses/i,
  },
  {
    vendor: 'Chaos Group',
    slug: 'v-ray',
    title: 'V-Ray',
    intro: intro(
      'Визуализация для 3ds Max, Maya, SketchUp, Rhino, Revit, Cinema 4D, Unreal и других ' +
        'программ: рабочие места, узлы рендеринга, аренда на месяц и год.',
    ),
    match: /V-Ray|Vray/i,
  },
  {
    vendor: 'Chaos Group',
    slug: 'phoenix-fd',
    title: 'Phoenix FD',
    intro: intro('Симуляция огня, дыма и жидкостей для 3ds Max и Maya.'),
    match: /Phoenix/i,
  },
  {
    vendor: 'Chaos Group',
    slug: 'vrscans',
    title: 'VRScans',
    intro: intro('Библиотека отсканированных материалов для V-Ray.'),
    match: /VRScans/i,
  },
  {
    vendor: 'Chaos Group',
    slug: 'pdplayer',
    title: 'Pdplayer',
    intro: intro('Просмотр и сборка последовательностей кадров.'),
    match: /Pdplayer/i,
  },
  // АСКОН
  {
    vendor: 'АСКОН',
    slug: 'kompas-libraries',
    title: 'Библиотеки и справочники для КОМПАС-3D',
    intro: intro('Стандартные изделия, материалы и сортаменты, справочники конструктора.'),
    match: /./,
  },
]

/** Производители, чьи товары раскладываются по семействам. */
export const FAMILY_VENDORS = [...new Set(FAMILIES.map((f) => f.vendor))]

/** «Право на использование программного обеспечения …» — служебное начало названия. */
const PREFIX = /^(?:Право на использование программного обеспечения|Программное обеспечение)\s+/i

/**
 * Раскладка товаров по семействам. Продления и пакеты — после основных, по названию.
 * @param {{ id: number, title: string, vendor: string, skip?: boolean }[]} products
 * @returns {{
 *   families: (FamilySeed & { members: { id: number, title: string, extra: boolean, order: number }[] })[],
 *   unmatched: { id: number, title: string, vendor: string }[],
 * }}
 */
export function planFamilies(products) {
  const families = FAMILIES.map((f) => ({
    ...f,
    members: /** @type {{ id: number, title: string, extra: boolean, order: number }[]} */ ([]),
  }))
  const unmatched = []
  for (const p of products) {
    if (p.skip || !FAMILY_VENDORS.includes(p.vendor)) continue
    const title = p.title.replace(PREFIX, '')
    const family = families.find(
      (f) => f.vendor === p.vendor && f.match.test(title) && !f.except?.test(title),
    )
    if (!family) {
      unmatched.push({ id: p.id, title: p.title, vendor: p.vendor })
      continue
    }
    family.members.push({ id: p.id, title: p.title, extra: EXTRA_TITLE.test(title), order: 0 })
  }
  for (const family of families) {
    const sorted = [...family.members].sort(
      (a, b) =>
        Number(a.extra) - Number(b.extra) ||
        a.title.replace(PREFIX, '').localeCompare(b.title.replace(PREFIX, ''), 'ru'),
    )
    let main = 0
    let extra = 0
    for (const m of sorted) m.order = m.extra ? EXTRA_ORDER + ++extra : ++main
    family.members = sorted
  }
  return { families: families.filter((f) => f.members.length), unmatched }
}
