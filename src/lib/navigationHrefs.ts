/** Адреса страниц. Модуль без серверных зависимостей: можно импортировать и в клиентских компонентах. */
export const catalogHref = (params: Record<string, string> = {}) => {
  const query = new URLSearchParams(params).toString()
  return `/${query ? `?${query}` : ''}#catalog`
}

export const productHref = (slug: string) => `/products/${slug}`
export const newsHref = (slug: string) => `/news/${slug}`
