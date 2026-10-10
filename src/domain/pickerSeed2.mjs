// @ts-check
/**
 * Четвёртая настройка подбора (catalog-setup:picker-v4, 10.10.2026): GEO5, Revit, ЛИРА-FEM, АВС,
 * сканеры Artec и страницы семейств ЛИРА (САПФИР, МОНОМАХ-САПР, ЭСПРИ). Черновик для проверки
 * владельцем на демо, дальше всё правится в админке. Названия, комплектации и цены — с демо
 * (перенесены из Битрикса), устройство комплектов — по ним же; чего нет в данных, не выдумываем:
 * у Revit и Artec цен нет — «Запросить цену».
 *
 * Товар варианта: slug (код адреса) или производитель + начало названия.
 * Шаг с `pick` берёт все товары производителя по образцу названия (кроме `except`),
 * подпись — название без `strip`.
 */

/**
 * @typedef {{ slug?: string, label: string, note?: string, offer?: RegExp, preselect?: boolean }} Item2
 * @typedef {{ vendor: string, title: RegExp, except?: string[], strip?: RegExp }} Pick2
 * @typedef {{ title: string, mode: 'base' | 'one' | 'many' | 'bundle', hint?: string,
 *   collapsed?: boolean, items?: Item2[], pick?: Pick2 }} Step2
 * @typedef {{ title: string, options: { value: string, note: string | null }[] }} Switch2
 * @typedef {{ slug: string, title?: string, renewLabel?: string, summary?: string, tasks?: string[],
 *   switches?: Switch2[], steps: Step2[] }} Picker2
 */

/** @type {Picker2} */
export const GEO5_PICKER = {
  slug: 'geo5',
  renewLabel: 'Продлить лицензию',
  tasks: ['Подпорные стены и котлованы', 'Фундаменты и сваи', 'Устойчивость откосов, МКЭ'],
  steps: [
    {
      title: 'Готовые комплекты',
      mode: 'bundle',
      hint: 'Комплект на год дешевле, чем те же программы по отдельности.',
      items: [
        {
          slug: 'geo5',
          offer: /^базовая/i,
          label: 'GEO5 Базовый',
          note: 'Основные программы для геотехники',
          preselect: true,
        },
        {
          slug: 'geo5',
          offer: /^профессионал/i,
          label: 'GEO5 Профессионал',
          note: 'Полный набор, включая МКЭ',
        },
        {
          slug: 'geo5',
          offer: /^основания/i,
          label: 'Основания зданий и сооружений',
          note: 'Фундаменты, сваи, осадка',
        },
        {
          slug: 'geo5',
          offer: /^подпорные/i,
          label: 'Подпорные стены',
          note: 'Уголковые, гравитационные, армированные стены',
        },
        {
          slug: 'geo5',
          offer: /^ограждение/i,
          label: 'Ограждение котлованов',
          note: 'Шпунт, стена в грунте, анкеры',
        },
        {
          slug: 'geo5',
          offer: /^геология/i,
          label: 'Геология',
          note: 'Стратиграфия, разрезы, лаборатория',
        },
      ],
    },
    {
      title: 'Отдельные программы GEO5',
      mode: 'many',
      hint: 'Каждая программа решает одну задачу. Лицензия на год.',
      pick: { vendor: 'Fine Software', title: /^GEO5\s/i, except: ['geo5'], strip: /^GEO5\s+/i },
    },
  ],
}

/** Модули GEO5 без своей страницы: старый адрес открывает подбор GEO5 с этим модулем. */
export const GEO5_NO_PAGE = { vendor: 'Fine Software', title: /^GEO5\s/i, except: ['geo5'] }

/** @type {Picker2} */
export const REVIT_PICKER = {
  slug: 'autodesk-revit',
  title: 'Revit',
  renewLabel: 'Продлить подписку',
  tasks: ['BIM-модель здания', 'Архитектура, конструкции, инженерные системы', 'Чертежи из модели'],
  switches: [
    {
      title: 'Срок подписки',
      options: [
        { value: '1 год', note: null },
        { value: '3 года', note: 'Одна оплата на три года' },
      ],
    },
  ],
  steps: [
    {
      title: 'Продукт',
      mode: 'one',
      items: [
        {
          slug: 'autodesk-revit',
          label: 'Revit',
          note: 'Архитектура, конструкции и инженерные системы',
          preselect: true,
        },
        {
          slug: 'autocad_revit_lt_suite',
          label: 'AutoCAD Revit LT Suite',
          note: 'AutoCAD LT и Revit LT в одном пакете',
        },
      ],
    },
    {
      title: 'Инженерные системы в Revit',
      mode: 'many',
      collapsed: true,
      hint: 'Дополнения для проектирования сетей. Работают внутри Revit.',
      pick: { vendor: 'MagiCAD', title: /для Revit$/i, strip: /\s+для Revit$/i },
    },
  ],
}

/** @type {Picker2} */
export const LIRA_PICKER = {
  slug: 'lira_sapr',
  renewLabel: 'Обновить версию',
  steps: [
    {
      title: 'Редакция',
      mode: 'one',
      hint: 'Редакции отличаются набором расчётов и размером модели.',
      items: [
        { slug: 'lira_sapr', offer: /^standart$/i, label: 'Standart', preselect: true },
        { slug: 'lira_sapr', offer: /^standart plus/i, label: 'Standart Plus' },
        { slug: 'lira_sapr', offer: /^pro$/i, label: 'Pro' },
        { slug: 'lira_sapr', offer: /^full$/i, label: 'Full', note: 'Все возможности' },
      ],
    },
    {
      title: 'Дополнительные расчёты',
      mode: 'many',
      collapsed: true,
      hint: 'Работают вместе с ЛИРА-FEM.',
      items: [
        { slug: 'lira_dinamika', label: 'Динамика во времени' },
        { slug: 'montazh', label: 'Монтаж', note: 'Расчёт по стадиям возведения' },
        { slug: 'grunt', label: 'Грунт', note: 'Модель грунтового основания' },
        { slug: 'the_resistance_to_lira_cad_2019', label: 'Огнестойкость' },
        { slug: 'the_thermal_conductivity_for_lira_sapr_2019', label: 'Теплопроводность' },
        { slug: 'the_steel_concrete', label: 'Сталежелезобетон' },
        { slug: 'reinforced_masonry_structures', label: 'Каменные и армокаменные конструкции' },
        { slug: 'the_section_designer_universal', label: 'Конструктор сечений Универсальный' },
      ],
    },
  ],
}

/** Модули ЛИРА-FEM без своей страницы: старый адрес открывает подбор ЛИРА с этим модулем. */
export const LIRA_NO_PAGE_SLUGS = [
  'lira_dinamika',
  'montazh',
  'grunt',
  'the_resistance_to_lira_cad_2019',
  'the_thermal_conductivity_for_lira_sapr_2019',
  'the_steel_concrete',
  'reinforced_masonry_structures',
  'the_section_designer_universal',
]

/** Снят с продажи (решение владельца 09.10): в черновики. */
export const DRAFT_SLUGS = ['akademik_set_2014']

/** Страницы семейств ЛИРА-FEM: линейки уже есть, программы в них разложены. */
export const LIRA_FAMILIES = [
  {
    vendor: 'ЛИРА-FEM',
    line: 'САПФИР',
    title: 'САПФИР',
    slug: 'sapfir',
    intro:
      'Программы ЛИРА-FEM для архитектурно-строительной модели, железобетонных конструкций и ' +
      'панельных зданий. Отметьте нужные — менеджер пришлёт коммерческое предложение.',
  },
  {
    vendor: 'ЛИРА-FEM',
    line: 'МОНОМАХ-САПР',
    title: 'МОНОМАХ-САПР',
    slug: 'monomakh-sapr',
    intro:
      'Проектирование многоэтажных железобетонных зданий: расчёт и конструирование. ' +
      'Выберите редакцию — менеджер пришлёт коммерческое предложение.',
  },
  {
    vendor: 'ЛИРА-FEM',
    line: 'ЭСПРИ',
    title: 'ЭСПРИ',
    slug: 'espri',
    intro:
      'Небольшие инженерные программы ЛИРА-FEM: сечения, прогибы, продавливание, нагрузки, ' +
      'фундаменты. Продаются по одной. Отметьте нужные — менеджер пришлёт предложение.',
  },
]

/** Защита и сметная база АВС: значения у предложений — по тексту комплектации из Битрикса. */
export const AVS_SWITCHES = [
  {
    title: 'Защита лицензии',
    options: [
      { value: 'Ключ Guardant', note: 'USB-ключ: можно переносить между компьютерами' },
      { value: 'Привязка к компьютеру', note: 'Без ключа, работает на одном компьютере' },
    ],
  },
  {
    title: 'Сметная база РСНБ',
    options: [
      { value: 'Без базы', note: null },
      { value: 'С базой РСНБ', note: 'АВС-4 сразу с республиканской сметно-нормативной базой' },
    ],
  },
]

/**
 * Значения переключателей АВС по комплектации: «привязка к ключу Guardant, РСНБ да».
 * Признак РСНБ — только у самого АВС-4 (withBase): у модулей «РСНБ нет» в тексте, но выбор базы
 * их не касается, иначе при «С базой РСНБ» модули стали бы недоступны.
 * @param {string} configuration
 * @param {boolean} withBase
 */
export function avsVariants(configuration, withBase) {
  const values = []
  if (/guardant/i.test(configuration)) values.push('Ключ Guardant')
  else if (/системн/i.test(configuration)) values.push('Привязка к компьютеру')
  if (withBase && /РСНБ\s*да/i.test(configuration)) values.push('С базой РСНБ')
  else if (withBase && /РСНБ\s*нет/i.test(configuration)) values.push('Без базы')
  return values
}

/** @type {Picker2} */
export const AVS_PICKER = {
  slug: 'the_software_package_avs_4',
  renewLabel: 'Обновить версию',
  switches: AVS_SWITCHES,
  steps: [
    {
      title: 'Программный комплекс',
      mode: 'base',
      items: [
        {
          slug: 'the_software_package_avs_4',
          label: 'АВС-KZ (АВС-4)',
          note: 'Сметы по нормативам Республики Казахстан',
        },
      ],
    },
    {
      title: 'Модули',
      mode: 'many',
      collapsed: true,
      items: [
        { slug: 'avs_akkord', label: 'АВС АККОРД', note: 'Сметы на ремонт и реконструкцию' },
        { slug: 'avs_pir', label: 'АВС ПИР', note: 'Сметы на проектно-изыскательские работы' },
        { slug: 'avs_rekompozitor', label: 'АВС Рекомпозитор' },
        {
          slug: 'avs_tssp_tsifrovaya_spetsifikatsiya_proekta',
          label: 'АВС-ЦСП',
          note: 'Цифровая спецификация проекта',
        },
      ],
    },
    {
      title: 'Сметно-нормативные базы',
      mode: 'many',
      collapsed: true,
      items: [
        {
          slug: 'svidetelstvo_rsnb_respubliki_kazakhstan_respublikanskaya_smetno_normativnaya_baza',
          label: 'Свидетельство РСНБ',
          note: 'Республиканская сметно-нормативная база',
        },
        { slug: 'srd_2024_smetno_normativnaya_baza', label: 'СРД сметно-нормативная база' },
        {
          slug: 'onv_reo_estimated_regulatory_framework',
          label: 'ОНВ РЭО сметно-нормативная база',
        },
      ],
    },
  ],
}

/** Товары АВС, чьи предложения получают значения переключателей. */
export const AVS_VARIANT_SLUGS = [
  'the_software_package_avs_4',
  'avs_akkord',
  'avs_pir',
  'avs_rekompozitor',
  'avs_tssp_tsifrovaya_spetsifikatsiya_proekta',
]

/** Переименования по ответам владельца 09.10 (адреса не меняются). */
export const RENAMES = [
  { slug: 'srd_2024_smetno_normativnaya_baza', title: 'СРД сметно-нормативная база' },
]

const ARTEC_EXTRAS = /** @type {Step2} */ ({
  title: 'Программы и аксессуары',
  mode: 'many',
  hint: 'Что входит в поставку сканера, уточнит менеджер.',
  items: [
    { slug: 'artec_studio_19', label: 'Artec Studio 19', note: 'Обработка сканов' },
    { slug: 'artec_cloud', label: 'Artec Cloud', note: 'Облачная обработка и хранение' },
    { slug: 'metrologicheskiy_nabor_artec', label: 'Метрологический набор Artec' },
  ],
})

/** Сканеры Artec: свой подбор у каждого — сам сканер и программы к нему. Цен нет — по запросу. */
export const ARTEC_SCANNERS = [
  'artec_leo',
  'artec_eva',
  'artec_eva_lite',
  'artec_spider_ii',
  'artec_micro_ii',
  'artec_point',
  'artec_ray_ii',
  'artec_jet',
]

/** @param {string} slug @param {string} label @returns {Picker2} */
export const artecPicker = (slug, label) => ({
  slug,
  steps: [{ title: 'Сканер', mode: 'base', items: [{ slug, label }] }, ARTEC_EXTRAS],
})

export const PICKERS2 = [GEO5_PICKER, REVIT_PICKER, LIRA_PICKER, AVS_PICKER]
