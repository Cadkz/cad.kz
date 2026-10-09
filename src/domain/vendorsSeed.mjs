/**
 * Вторая настройка каталога (замечания владельца после демо 09.10.2026): дубли производителей,
 * CSoft в топ, приложения в конец, первые линейки SCAD Soft и ЛИРА-FEM, порядок производителей
 * в «Расчёте конструкций». Дальше всё правится в админке.
 */

/**
 * Дубли производителей: товары переносятся к записи с бо́льшим числом товаров, лишняя удаляется,
 * оставшейся даётся название keep.
 */
export const VENDOR_MERGES = [
  { keep: 'SCAD Soft', titles: ['SCAD', 'SCAD Soft'] },
  { keep: 'MagiCAD', titles: ['MagiCAD', 'MagiCAD Group'] },
]

/** Уровень производителям («Scoft» из списка топов владельца — это CSoft). */
export const VENDOR_LEVELS = { 'Csoft Development': 'top' }

/**
 * Приложения и дополнения к основной программе — в конец списков: мобильные приложения, Premium,
 * пакеты облачных кредитов.
 */
export const APP_TITLE = /\bmobile app\b|\bpremium\b|cloud credits, pack/i

/** Порядок производителей в разделах (slug → названия), заменяет прежний. */
export const SECTION_PINS = {
  structural: ['SCAD Soft', 'ЛИРА-FEM', 'Base', 'Autodesk'],
  geotech: ['Fine Software', 'ЛИРА-FEM', 'SCAD Soft'],
}

/**
 * Линейки и товары в них. Правило товара: [слова в начале названия, порядок в линейке]; первое
 * подходящее правило по всем линейкам производителя. Порядок 1 — основа линейки.
 * @type {{ vendor: string, lines: { title: string, order: number, products: [RegExp, number][] }[] }[]}
 */
export const LINE_SEED = [
  {
    vendor: 'SCAD Soft',
    lines: [
      {
        title: 'Программный комплекс',
        order: 10,
        products: [
          [/^SCAD Office\b/i, 1],
          [/универсальный комплект/i, 2],
          [/^SCAD комплект/i, 3],
          [
            /^(Монтаж|Нелинейный процессор|Прогрессирующее обрушение|Расчет спектров|Вариации моделей|Амплитудно-частотные|Огнестойкость)/i,
            5,
          ],
        ],
      },
      {
        title: 'Сателлиты',
        order: 20,
        products: [
          [
            /^(АРБАТ|ДЕКОР|ЗАПРОС|КАМИН|КОМЕТА|КРИСТАЛЛ|КРОСС|МАГНУМ|МОНОЛИТ|ОТКОС|ВЕСТ|Редактор акселерограмм)/i,
            1,
          ],
          [/^(Конструктор сечений|КОНСУЛ|СЕЗАМ|ТОНУС)/i, 2],
        ],
      },
      { title: 'Справочники', order: 30, products: [[/справочник/i, 1]] },
    ],
  },
  {
    vendor: 'ЛИРА-FEM',
    lines: [
      {
        title: 'Программный комплекс',
        order: 10,
        products: [
          [/^ЛИРА\s*-\s*FEM/i, 1],
          [/^Академик/i, 2],
          [
            /^(Динамика во времени|Каменные|Конструктор сечений|Монтаж|Огнестойкость|Сталежелезобетон|Теплопроводность|ГРУНТ)/i,
            3,
          ],
        ],
      },
      {
        title: 'САПФИР',
        order: 20,
        products: [
          [/^САПФИР 3D/i, 1],
          [/^САПФИР/i, 2],
        ],
      },
      {
        title: 'МОНОМАХ-САПР',
        order: 30,
        products: [
          [/^МОНОМАХ-САПР PRO/i, 1],
          [/^МОНОМАХ/i, 2],
        ],
      },
      {
        title: 'ЭСПРИ',
        order: 40,
        products: [
          [/^ПК ЭСПРИ/i, 1],
          [/ЭСПРИ/i, 2],
        ],
      },
    ],
  },
]

/**
 * Линейка и порядок товара производителя по LINE_SEED или null.
 * @param {string} vendor
 * @param {string} title
 * @returns {{ line: string, order: number } | null}
 */
export function seedLine(vendor, title) {
  const seed = LINE_SEED.find((item) => item.vendor === vendor)
  for (const line of seed?.lines ?? [])
    for (const [pattern, order] of line.products)
      if (pattern.test(title.trim())) return { line: line.title, order }
  return null
}
