/** Адреса страниц. Модуль без серверных зависимостей: можно импортировать и в клиентских компонентах. */
export const CATALOG_PATH = '/catalog'

export const catalogHref = (params: Record<string, string> = {}) => {
  const query = new URLSearchParams(params).toString()
  return `${CATALOG_PATH}${query ? `?${query}` : ''}`
}

export const productHref = (slug: string) => `/products/${slug}`
export const newsHref = (slug: string) => `/news/${slug}`
