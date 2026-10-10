// Семейства редких товаров CSoft, MagiCAD, НТП Трубопровод, Chaos и АСКОН: правила раскладки
// по названиям (10.10.2026, проверено владельцем). Товар попадает в первое подходящее
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
    intro: intro(
      'Прочность и жёсткость трубопроводов: основа СТАРТ-Проф, дополнительные модули и расчёт ' +
        'остаточного ресурса.',
    ),
    match: /^СТАРТ|^Ресурс$/,
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
    intro: intro('Учебные лицензии V-Ray и VRScans для студентов, преподавателей и классов.'),
    match: /студентов|Academic licenses/i,
  },
  {
    vendor: 'Chaos Group',
    slug: 'v-ray',
    title: 'V-Ray',
    intro: intro(
      'Визуализация V-Ray для Cinema 4D и Unreal, облачные кредиты для рендеринга и ключ ' +
        'защиты: аренда на месяц и год.',
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

/**
 * Группы без своей страницы (решение владельца 10.10): у программ свои страницы, линейка только
 * собирает их в меню и каталоге. Продления и комплекты в группу не входят — они вариантами
 * на странице программы (OPTION_RULES).
 * @typedef {{ vendor: string, title: string, match: RegExp, except?: RegExp }} LineSeed
 * @type {LineSeed[]}
 */
export const PLAIN_LINES = [
  {
    vendor: 'Csoft Development',
    title: 'Model Studio CS и CADLib',
    match: /Model Studio CS|CADLib/i,
    except: /подписка на обновления/i,
  },
  { vendor: 'MagiCAD', title: 'MagiCAD для Revit', match: /для Revit/i },
  { vendor: 'MagiCAD', title: 'MagiCAD для AutoCAD', match: /MagiCAD/i, except: /Suite/i },
]

/** Снято с продажи в Казахстане (ответ владельца 10.10): в черновики. */
export const DRAFT_TITLE = { vendor: 'Csoft Development', match: /PlanTracer/i }

/**
 * Варианты на странице программы: сама программа и альтернатива (продление, комплект).
 * Альтернатива получает вид «Без своей страницы», её старый адрес открывает программу
 * с выбранной альтернативой (?pick=ID). Одна альтернатива может быть у нескольких программ:
 * комплект MagiCAD Suite — и у версии для AutoCAD, и у версии для Revit.
 * @typedef {{
 *   vendor: string, step: string, base: RegExp, alt: (title: string) => RegExp | null,
 *   baseLabel: string, altLabel: (altTitle: string) => string, altNote: string,
 *   licenseSwitches?: boolean,
 * }} OptionRule
 * @type {OptionRule[]}
 */
export const OPTION_RULES = [
  {
    vendor: 'Csoft Development',
    step: 'Лицензия',
    base: /^(?:Model Studio CS|CADLib)/i,
    alt: (title) => new RegExp(`^Подписка на обновления ${escapeRegExp(title)}$`, 'i'),
    baseLabel: 'Новая лицензия',
    altLabel: () => 'Подписка на обновления',
    altNote: 'Если программа уже куплена',
    licenseSwitches: true,
  },
  {
    vendor: 'MagiCAD',
    step: 'Что купить',
    base: /^MagiCAD (?!Suite)/i,
    alt: (title) => {
      const part = /^MagiCAD (.+?)(?: для Revit)?$/i.exec(title)?.[1]
      return part ? new RegExp(`^MagiCAD Suite ${escapeRegExp(part)}$`, 'i') : null
    },
    baseLabel: 'Только эта программа',
    altLabel: (altTitle) => `Комплект ${altTitle}`,
    altNote: 'Версии для AutoCAD и для Revit вместе',
  },
]

/**
 * Переключатели «Вид лицензии» и «Срок» по условиям лицензии предложения из Битрикса
 * («сетевая, доп. место, на 2 года»). Порядок значений — порядок показа, первое выбрано сразу.
 */
export const LICENSE_SWITCHES = [
  {
    title: 'Вид лицензии',
    options: [
      { value: 'Локальная', note: 'Один компьютер', test: /локальн/i },
      { value: 'Сетевая: сервер', note: 'Серверная часть сетевой лицензии', test: /серверн/i },
      {
        value: 'Сетевая: доп. место',
        note: 'Ещё одно рабочее место к серверу',
        test: /доп\. место/i,
      },
    ],
  },
  {
    title: 'Срок',
    options: [
      { value: '1 год', note: null, test: /на 1 год/i },
      { value: '2 года', note: null, test: /на 2 года/i },
      { value: '3 года', note: null, test: /на 3 года/i },
      { value: 'Квартал', note: null, test: /квартальн/i },
      { value: 'Бессрочная', note: null, test: /бессрочн/i },
    ],
  },
]

/**
 * Значения переключателей для предложения по тексту условий лицензии.
 * @param {string | null | undefined} license
 * @returns {string[]}
 */
export function licenseVariants(license) {
  if (!license) return []
  return LICENSE_SWITCHES.flatMap((sw) => {
    const option = sw.options.find((o) => o.test.test(license))
    return option ? [option.value] : []
  })
}

/**
 * Переключатели только с теми значениями, что есть у предложений; переключатель с одним
 * значением не нужен.
 * @param {string[][]} offerVariants
 */
export function usedLicenseSwitches(offerVariants) {
  const used = new Set(offerVariants.flat())
  return LICENSE_SWITCHES.map((sw) => ({
    title: sw.title,
    options: sw.options
      .filter((o) => used.has(o.value))
      .map((o) => ({ value: o.value, note: o.note })),
  })).filter((sw) => sw.options.length > 1)
}

/** @param {string} text */
function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Группы, варианты и черновики для товаров, не вошедших в семейства.
 * @param {{ id: number, title: string, vendor: string, skip?: boolean }[]} products
 */
export function planExtras(products) {
  const free = products.filter((p) => !p.skip)
  /** @type {{ title: string, vendor: string, ids: number[] }[]} */
  const lines = []
  /** @type {{ productId: number, step: string, licenseSwitches: boolean, items: { productId: number, label: string, note: string | null, preselect: boolean }[] }[]} */
  const options = []
  const noPage = new Set()
  const drafts = free
    .filter((p) => p.vendor === DRAFT_TITLE.vendor && DRAFT_TITLE.match.test(p.title))
    .map((p) => p.id)
  for (const rule of OPTION_RULES) {
    const own = free.filter((p) => p.vendor === rule.vendor)
    for (const base of own.filter((p) => rule.base.test(p.title))) {
      const pattern = rule.alt(base.title)
      const alt = pattern ? own.find((p) => p.id !== base.id && pattern.test(p.title)) : null
      if (!alt) continue
      noPage.add(alt.id)
      options.push({
        productId: base.id,
        step: rule.step,
        licenseSwitches: Boolean(rule.licenseSwitches),
        items: [
          { productId: base.id, label: rule.baseLabel, note: null, preselect: true },
          {
            productId: alt.id,
            label: rule.altLabel(alt.title),
            note: rule.altNote,
            preselect: false,
          },
        ],
      })
    }
  }
  const taken = new Set([...noPage, ...drafts])
  for (const line of PLAIN_LINES) {
    const ids = free
      .filter(
        (p) =>
          p.vendor === line.vendor &&
          !taken.has(p.id) &&
          line.match.test(p.title) &&
          !line.except?.test(p.title),
      )
      .sort((a, b) => a.title.localeCompare(b.title, 'ru'))
      .map((p) => p.id)
    for (const id of ids) taken.add(id)
    if (ids.length) lines.push({ title: line.title, vendor: line.vendor, ids })
  }
  return { lines, options, noPage: [...noPage], drafts }
}
