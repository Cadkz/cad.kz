/**
 * Адрес публикации из названия (решение владельца 15.10.2026: как «Символьный код» в Битриксе).
 * Транслитерация как у перенесённых со старого сайта адресов: «Вам шашечки или ехать» →
 * vam-shashechki-ili-ekhat. Казахские буквы — по ближайшей русской.
 */

/** Длина адреса: как у перенесённых публикаций. */
export const SLUG_MAX = 90

const LETTERS = Object.fromEntries(
  (
    'а:a б:b в:v г:g д:d е:e ё:e ж:zh з:z и:i й:y к:k л:l м:m н:n о:o п:p р:r с:s т:t у:u ф:f ' +
    'х:kh ц:ts ч:ch ш:sh щ:shch ъ: ы:y ь: э:e ю:yu я:ya ' +
    'ә:a ғ:g қ:k ң:n ө:o ұ:u ү:u һ:h і:i'
  )
    .split(' ')
    .map((pair) => pair.split(':')),
)

/**
 * Название → адрес латиницей: строчные буквы, цифры и дефисы, не длиннее SLUG_MAX, обрезка
 * по границе слова.
 * @param {string | null | undefined} title
 */
export function slugFromTitle(title) {
  const latin = [...String(title ?? '').toLowerCase()].map((ch) => LETTERS[ch] ?? ch).join('')
  const slug = latin
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  if (slug.length <= SLUG_MAX) return slug
  const cut = slug.slice(0, SLUG_MAX + 1)
  const dash = cut.lastIndexOf('-')
  return (dash > SLUG_MAX / 2 ? cut.slice(0, dash) : cut.slice(0, SLUG_MAX)).replace(/-+$/, '')
}

/**
 * Свободный адрес: base, а если занят — base-2, base-3, … (с учётом длины).
 * @param {string} base
 * @param {(slug: string) => Promise<boolean>} taken
 */
export async function freeSlug(base, taken) {
  if (!(await taken(base))) return base
  for (let n = 2; n < 1000; n++) {
    const suffix = `-${n}`
    const slug = `${base.slice(0, SLUG_MAX - suffix.length).replace(/-+$/, '')}${suffix}`
    if (!(await taken(slug))) return slug
  }
  return `${base.slice(0, SLUG_MAX - 14)}-${Date.now()}`
}
