import { courseWords } from './courseSchedule.mjs'

/** Выбор курса без смешивания разных программ и без зависимости от ближайшей группы.
 * @param {{id: number, title: string, aliases: string[]}[]} courses
 * @param {string} query
 * @param {number | undefined} id
 */
export function detailCandidates(courses, query, id) {
  if (id !== undefined) return courses.filter((course) => course.id === id)
  const words = courseWords(query)
  if (!words.length) return []
  const exact = courses.filter((course) =>
    [course.title, ...course.aliases].some(
      (title) => title.trim().toLowerCase() === query.trim().toLowerCase(),
    ),
  )
  return exact.length
    ? exact
    : courses.filter((course) =>
        [course.title, ...course.aliases].some((title) => {
          const own = courseWords(title)
          return words.every((word) => own.some((value) => value.startsWith(word)))
        }),
      )
}
