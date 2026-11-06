// @ts-check
/**
 * Языки сайта (решение владельца 06.11.2026). Русский — на прежних адресах без приставки,
 * казахский — /kk/…, английский — /en/…; адреса страниц после приставки те же.
 * Язык сам по браузеру не меняется: первый заход всегда русский.
 */

/** @typedef {'ru' | 'kk' | 'en'} Lang */

/** @type {readonly Lang[]} */
export const LANGS = ['ru', 'kk', 'en']
/** @type {Lang} */
export const DEFAULT_LANG = 'ru'

/** Заголовок запроса, которым proxy передаёт язык страницам. */
export const LANG_HEADER = 'x-site-lang'

/** Подписи в переключателе (решение владельца 06.11.2026: RU / KZ / EN). */
export const LANG_LABELS = { ru: 'RU', kk: 'KZ', en: 'EN' }
/** Полные названия — для подсказки и чтения с экрана. */
export const LANG_NAMES = { ru: 'Русский', kk: 'Қазақша', en: 'English' }
/** Для openGraph. */
export const OG_LOCALES = { ru: 'ru_KZ', kk: 'kk_KZ', en: 'en_US' }

/**
 * Пока товары не переведены (п. 2 плана), казахская и английская версии закрыты от поисковиков:
 * полупустые копии русских страниц навредили бы её позициям. Перевели — поставить true:
 * откроется индексация, появятся hreflang и адреса в карте сайта.
 */
export const INDEX_TRANSLATIONS = false

/**
 * @param {unknown} value
 * @returns {value is Lang}
 */
export function isLang(value) {
  return typeof value === 'string' && /** @type {readonly string[]} */ (LANGS).includes(value)
}

/**
 * Язык из адреса и адрес без приставки: /kk/catalog → { lang: 'kk', path: '/catalog' }.
 * @param {string} pathname
 * @returns {{ lang: Lang, path: string }}
 */
export function splitLangPath(pathname) {
  const match = /^\/(kk|en)(?=\/|$)(.*)$/.exec(pathname)
  if (!match) return { lang: DEFAULT_LANG, path: pathname || '/' }
  return { lang: /** @type {Lang} */ (match[1]), path: match[2] || '/' }
}

/** Служебные адреса и файлы: у них нет языковой версии. */
const NOT_LOCALIZED = /^\/(api|admin|_next|fonts|images|media|models|scan-posters)(\/|$)/

/**
 * Адрес страницы на нужном языке. Внешние ссылки, якоря, tel:, mailto:, служебные адреса
 * и файлы с расширением не трогаются.
 * @param {Lang} lang
 * @param {string} href
 */
export function localizeHref(lang, href) {
  if (!href.startsWith('/') || href.startsWith('//')) return href
  const end = href.search(/[?#]/)
  const pathname = end === -1 ? href : href.slice(0, end)
  const rest = end === -1 ? '' : href.slice(end)
  const { path } = splitLangPath(pathname)
  if (NOT_LOCALIZED.test(path) || /\.[a-z0-9]{2,5}$/i.test(path)) return href
  if (lang === DEFAULT_LANG) return `${path}${rest}`
  return `${path === '/' ? `/${lang}` : `/${lang}${path}`}${rest}`
}
