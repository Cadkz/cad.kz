// @ts-check
/**
 * Первая настройка подбора (catalog-setup:picker-v1): черновик для AutoCAD и SCAD Office и
 * семейство сателлитов SCAD. Товары ищутся по прежнему коду адреса (slug) или по началу названия.
 * Дальше всё правится в админке: «Вид страницы», «Подбор комплекта», «Страница семейства».
 *
 * Устройство SCAD — по официальному прайсу SCAD Office 25.1: основа SCAD++ SSB обязательна,
 * пакеты Ж/Б (RC), металл (SS), дерево (TS) добавляются к ней; Универсальный пакет = их сумма;
 * доп. функции и сателлиты — одной ценой без редакций; полная конфигурация дешевле, чем всё отдельно.
 */

/** @typedef {{ slug?: string, title?: RegExp, label: string, note?: string, offer?: RegExp, preselect?: boolean }} SeedItem */
/** @typedef {{ title: string, mode: 'base' | 'one' | 'many' | 'bundle', hint?: string, collapsed?: boolean, items?: SeedItem[], line?: string }} SeedStep */

export const SCAD_EDITION = {
  title: 'Редакция',
  options: [
    { value: 'S392', note: 'До 392 000 степеней свободы, около 65 000 узлов' },
    { value: 'SPro', note: 'Без ограничения размера схемы' },
  ],
}

/**
 * Значение редакции по комплектации из Битрикса: «SCAD++ … S392» или «… SPRO».
 * @param {string} configuration
 */
export function scadEdition(configuration) {
  if (/S\s*392\b/i.test(configuration)) return 'S392'
  if (/S\s*P\s*r\s*o/i.test(configuration)) return 'SPro'
  return null
}

const SCAD_EXTRAS = [
  [/^Нелинейный процессор \(расчет физически/i, 'Нелинейный процессор: физическая нелинейность'],
  [
    /^Нелинейный процессор \(расчет геометрически/i,
    'Нелинейный процессор: геометрическая нелинейность',
  ],
  [/^Монтаж - расчет/i, 'Монтаж: расчёт по стадиям строительства'],
  [/^Монтаж с учетом нелинейной/i, 'Монтаж с учётом нелинейной работы'],
  [/^Прогрессирующее обрушение/i, 'Прогрессирующее обрушение'],
  [/^Расчет спектров ответа/i, 'Поэтажные спектры ответа (сейсмика)'],
  [/^Амплитудно-частотные/i, 'Амплитудно-частотные характеристики'],
  [/^Вариации моделей/i, 'Вариации моделей'],
  [/^Огнестойкость/i, 'Огнестойкость стальных и ж/б элементов'],
]

/** @type {{ slug: string, pageView: 'picker', renewLabel: string, tasks: string[], switch: typeof SCAD_EDITION, steps: SeedStep[] }} */
export const SCAD_PICKER = {
  slug: 'scad_v23',
  pageView: 'picker',
  renewLabel: 'Обновить версию',
  tasks: ['Статика и динамика МКЭ', 'Подбор арматуры и проверка стали', 'Сейсмические расчёты'],
  switch: SCAD_EDITION,
  steps: [
    {
      title: 'Основа',
      mode: 'base',
      hint: 'Вычислительный комплекс SCAD++: без него пакеты проверки не работают.',
      items: [
        {
          slug: 'scad_komplekt_ssb_napryazhenno_deformirovannoe_sostoyanie',
          label: 'Напряжённо-деформированное состояние (SSB)',
          note: 'Статика, динамика, устойчивость, расчётные сочетания усилий',
        },
      ],
    },
    {
      title: 'Что будете проверять',
      mode: 'many',
      hint: 'Отметьте нужное. Все три вместе — это Универсальный пакет, цена та же.',
      items: [
        {
          slug: 'scad_komplekt_rc',
          label: 'Ж/Б конструкции (RC)',
          note: 'Проверка и подбор арматуры',
        },
        {
          slug: 'scad_komplekt_ss',
          label: 'Стальные конструкции (SS)',
          note: 'Проверка и подбор элементов',
        },
        {
          slug: 'scad_komplekt_ts',
          label: 'Деревянные конструкции (TS)',
          note: 'Проверка элементов',
        },
      ],
    },
    {
      title: 'Дополнительные функции SCAD++',
      mode: 'many',
      collapsed: true,
      hint: 'Работают только вместе с основой.',
      items: SCAD_EXTRAS.map(([title, label]) => ({
        title: /** @type {RegExp} */ (title),
        label: /** @type {string} */ (label),
      })),
    },
    {
      title: 'Программы-сателлиты',
      mode: 'many',
      collapsed: true,
      hint: 'Отдельные программы для проверки элементов, нагрузок и сечений.',
      line: 'Сателлиты',
    },
    {
      title: 'Готовые комплекты',
      mode: 'bundle',
      hint: 'Полная конфигурация выходит дешевле, чем всё по отдельности.',
      items: [
        {
          slug: 'scad_universalnyy_komplekt',
          label: 'Универсальный пакет (US)',
          note: 'Основа + Ж/Б + металл + дерево',
        },
        {
          slug: 'scad_v23',
          offer: /^С доп/i,
          label: 'Полная конфигурация SCAD Office',
          note: 'Все пакеты, дополнительные функции и все сателлиты',
        },
        {
          slug: 'scad_v23',
          offer: /^Без доп/i,
          label: 'SCAD Office без дополнительных функций',
          note: 'Все пакеты и сателлиты, без доп. функций SCAD++',
        },
      ],
    },
  ],
}

/** Пакеты и доп. функции SCAD: своей страницы нет, прежний адрес ведёт на подбор SCAD Office. */
export const SCAD_NO_PAGE_SLUGS = [
  'scad_komplekt_ssb_napryazhenno_deformirovannoe_sostoyanie',
  'scad_komplekt_rc',
  'scad_komplekt_ss',
  'scad_komplekt_ts',
  'scad_universalnyy_komplekt',
]
export const SCAD_NO_PAGE_TITLES = SCAD_EXTRAS.map(([title]) => /** @type {RegExp} */ (title))

/** Полные конфигурации SCAD Office на сайте сейчас в одной редакции — SPro (S392 в прайсе без пары). */
export const SCAD_OFFICE_EDITION = 'SPro'

export const SCAD_FAMILY = {
  vendor: 'SCAD Soft',
  line: 'Сателлиты',
  title: 'Программы-сателлиты',
  slug: 'scad-satellites',
  intro:
    'Отдельные программы SCAD Soft для проверки элементов конструкций, расчёта нагрузок и ' +
    'сечений. Продаются по одной. Отметьте нужные — менеджер пришлёт коммерческое предложение.',
}

/** @type {{ slug: string, pageView: 'picker', renewLabel: string, summary: string, tasks: string[], switch: { title: string, options: { value: string, note: string | null }[] }, steps: SeedStep[] }} */
export const AUTOCAD_PICKER = {
  slug: 'autocad',
  pageView: 'picker',
  renewLabel: 'Продлить подписку',
  summary:
    'Самая популярная САПР для 2D-черчения и 3D-моделирования. Полная версия включает отраслевые ' +
    'наборы: Architecture, Mechanical, Electrical, MEP, Plant 3D, Map 3D и Raster Design.',
  tasks: ['2D-черчение и документация', '3D-моделирование', 'Отраслевые наборы инструментов'],
  switch: {
    title: 'Срок подписки',
    options: [
      { value: '1 год', note: null },
      { value: '3 года', note: 'Одна оплата на три года' },
    ],
  },
  steps: [
    {
      title: 'Версия',
      mode: 'one',
      items: [
        {
          slug: 'autocad',
          label: 'AutoCAD',
          note: '2D и 3D, отраслевые наборы, веб- и мобильная версии',
          preselect: true,
        },
        { slug: 'autocad_lt_for_mac', label: 'AutoCAD LT', note: 'Только 2D-черчение' },
        {
          slug: 'autocad_revit_lt_suite',
          label: 'AutoCAD Revit LT Suite',
          note: 'AutoCAD LT и Revit LT в одном пакете',
        },
      ],
    },
  ],
}

/** AutoCAD LT for Mac: своей страницы нет, адрес ведёт на AutoCAD с выбранным LT. */
export const AUTOCAD_NO_PAGE_SLUGS = ['autocad_lt_for_mac']
