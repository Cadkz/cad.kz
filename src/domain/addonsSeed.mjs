// @ts-check
/**
 * Дополнения к базовым программам (замечание владельца 13.10.2026): по запросу «автокад» нужны
 * сам AutoCAD и отдельной группой то, что работает внутри него (MagiCAD для AutoCAD, СПДС
 * GraphiCS), а в «С этим покупают» у AutoCAD первым — MagiCAD для AutoCAD. Для этого у таких
 * товаров заполняется «Требуется базовое ПО». Правила — по линейке и названию, только там, где
 * на сайте производителя или в описании товара прямо сказано, в какой программе он работает.
 * Поле, заполненное в админке, не трогаем. Продления и курсы не связываем: это не дополнения.
 */

/**
 * @typedef {{ base: string, lines?: string[], titles?: RegExp[], except?: RegExp }} AddonRule
 * base — точное название базовой программы в каталоге; lines — линейки; titles — названия.
 */

/** @type {AddonRule[]} */
export const ADDON_RULES = [
  {
    base: 'AutoCAD',
    lines: ['MagiCAD для AutoCAD', 'СПДС', 'Project Studio CS', 'GeoniCS', 'MechaniCS'],
    titles: [/^MagiCAD Suite /, /^RasterDesk/, /AddIns for AutoCAD/],
    except: /nanoCAD/i,
  },
  { base: 'Inventor Professional', lines: ['MechaniCS'] },
  { base: 'Revit', lines: ['MagiCAD для Revit', 'Программы НТП для Revit'] },
]

/** Не дополнения: продления и обновления лицензий, курсы. */
const NOT_ADDON = /^(подписка на обновлени|обновлени|продлени|upgrade|курс|онлайн[- ]курс)/i

/**
 * Базовые программы товара по правилам (названия), пусто — товар не дополнение.
 * @param {{ title: string, kind?: string | null, line?: string | null }} product
 * @returns {string[]}
 */
export function addonBases({ title, kind, line }) {
  if (kind === 'course' || NOT_ADDON.test(title.trim())) return []
  return ADDON_RULES.filter(
    (rule) =>
      !rule.except?.test(title) &&
      ((line != null && (rule.lines ?? []).includes(line)) ||
        (rule.titles ?? []).some((pattern) => pattern.test(title))),
  ).map((rule) => rule.base)
}

/**
 * Переименования вместе с дополнениями. В каталоге из Битрикса был только «AutoCAD LT for Mac»
 * (вариант в подборе AutoCAD), а подписка AutoCAD LT одна на Windows и Mac — владелец ищет
 * «автокад лт». Адрес товара не меняется.
 */
export const RENAMES = [
  { from: 'AutoCAD LT for Mac', to: 'AutoCAD LT', aliases: 'акад лт, автокад лт, autocad lt' },
]
