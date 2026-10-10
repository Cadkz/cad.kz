// @ts-check
/**
 * Первое наполнение поля «Другие названия для поиска» у ходовых товаров. Только сокращения и
 * разговорные названия, которых поиск не угадает по буквам; русские буквы вместо латинских
 * («ревит», «гео5») и опечатки он понимает сам. Товар — по точному названию; поле, которое уже
 * заполнено в админке, не трогаем.
 */
export const SEARCH_ALIASES = [
  { title: 'AutoCAD', aliases: 'акад, автокад' },
  { title: 'AutoCAD LT', aliases: 'акад лт, автокад лт' },
  { title: 'AutoCAD Revit LT Suite', aliases: 'акад ревит' },
  { title: 'Civil 3D', aliases: 'цивил' },
  { title: '3ds Max', aliases: 'макс, 3д макс' },
  { title: 'Navisworks Manage', aliases: 'навис' },
]

/**
 * Вторая волна (аудит ChatGPT №2, 11.10.2026): общие слова, по которым ходовой товар должен быть
 * первым, а не модуль другого производителя с этим словом в названии («смета» — АВС, а не «БДТП -
 * Смета»). Слова добавляются к уже заполненному полю, если их там нет.
 */
export const SEARCH_ALIASES_V2 = [
  { title: 'Программный комплекс АВС-KZ (АВС-4)', aliases: 'смета, сметы, сметная программа' },
  { title: 'TDMS Фарватер', aliases: 'документооборот, электронный архив' },
]

/**
 * Слить другие названия: к прежним добавить новые, которых ещё нет.
 * @param {string | null | undefined} current
 * @param {string} extra
 */
export function mergeAliases(current, extra) {
  const list = (current ?? '')
    .split(',')
    .map((alias) => alias.trim())
    .filter(Boolean)
  const known = new Set(list.map((alias) => alias.toLowerCase()))
  for (const alias of extra.split(',').map((item) => item.trim()))
    if (alias && !known.has(alias.toLowerCase())) {
      list.push(alias)
      known.add(alias.toLowerCase())
    }
  return list.join(', ')
}
