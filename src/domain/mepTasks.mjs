/**
 * Задачи для фильтра раздела «Инженерные сети» (catalog-setup:mep-tasks-v1): без них путь
 * «вентиляция» в каталоге — только через поиск. Задача ставится, если слово есть в названии,
 * анонсе, других названиях или начале описания товара.
 */
export const MEP_TASKS = [
  { task: 'Вентиляция и кондиционирование', match: /вентиляц|кондиционир|\bОиВ\b|HVAC/i },
  { task: 'Отопление', match: /отоплен|теплоснабж/i },
  { task: 'Водоснабжение и канализация', match: /водоснабж|водопровод|канализац|\bВК\b/i },
  { task: 'Электроснабжение', match: /электроснабж|электроосвещ|электрооборуд/i },
]

/** Сколько задач всего у товара: они же значками в шапке его страницы, больше — шум. */
export const MAX_TASKS = 5

/**
 * Какие задачи дописать товару. Уже стоящие не повторяются, вписанные вручную не трогаются.
 * @param {string} text  Название, анонс, другие названия и начало описания одной строкой.
 * @param {string[]} current
 * @returns {string[]}
 */
export function mepTasksFor(text, current) {
  const have = new Set(current.map((t) => t.toLowerCase()))
  const add = MEP_TASKS.filter(
    (rule) => rule.match.test(text) && !have.has(rule.task.toLowerCase()),
  ).map((rule) => rule.task)
  return add.slice(0, Math.max(0, MAX_TASKS - current.length))
}
