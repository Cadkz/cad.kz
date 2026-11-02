// @ts-check
/**
 * «АРБАТ - экспертиза и расчёт» → { name: «АРБАТ», rest: «экспертиза и расчёт» }; без тире — null.
 * Тире внутри кавычек не делит: «Онлайн курс «AutoCAD. 3D - моделирование и визуализация»» —
 * одно название (замечание 02.11.2026: на карточке было «…3D» и ниже «Моделирование…»»).
 * @param {string} title
 * @param {number} [max] самая длинная первая часть
 * @returns {{ name: string, rest: string } | null}
 */
export function titleDash(title, max = 40) {
  const dash = /\s+[-–—]\s+/g
  for (let match = dash.exec(title); match; match = dash.exec(title)) {
    const name = title.slice(0, match.index)
    const rest = title.slice(match.index + match[0].length)
    if (name.length > max) return null
    const quotes = (name.match(/«/g)?.length ?? 0) - (name.match(/»/g)?.length ?? 0)
    const straight = (name.match(/"/g)?.length ?? 0) % 2
    if (name.length >= 2 && rest.length >= 3 && !quotes && !straight) return { name, rest }
  }
  return null
}
