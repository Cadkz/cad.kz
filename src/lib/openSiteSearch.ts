/** Событие, которым меню телефона открывает поиск по сайту (слой на весь экран из шапки). */
export const OPEN_SITE_SEARCH_EVENT = 'site-search:open'

/** Открыть поиск на весь экран (телефон: поля поиска в шапке нет, оно в меню). */
export function openSiteSearch() {
  window.dispatchEvent(new Event(OPEN_SITE_SEARCH_EVENT))
}
