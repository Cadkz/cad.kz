import type { Metadata } from 'next'

/** Поля «Для поисковиков» из CMS. */
type Seo = { title?: string | null; description?: string | null } | null | undefined

/**
 * Рабочий режим сайта: всё, кроме демо. В демо поисковикам закрыто всё, в рабочем режиме
 * открыты страницы витрины, а карта сайта перечисляет их полными адресами.
 */
export const isProduction = () => process.env.APP_MODE !== 'demo'

/**
 * Адрес сайта для карты сайта и канонических ссылок: SITE_URL, на демо Vercel — его адрес,
 * иначе https://cad.kz. Без слеша в конце.
 */
export function siteUrl() {
  const fromEnv = process.env.SITE_URL?.trim()
  if (fromEnv) return fromEnv.replace(/\/+$/, '')
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()
  if (vercel) return `https://${vercel}`
  return 'https://cad.kz'
}

/** Текст для description: без лишних пробелов и не длиннее 160 знаков (обрезка по слову). */
export function shortDescription(text: string | null | undefined, max = 160) {
  const clean = (text ?? '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^(## |- |> )/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (clean.length <= max) return clean || undefined
  const cut = clean.slice(0, max - 1)
  const space = cut.lastIndexOf(' ')
  return `${(space > max / 2 ? cut.slice(0, space) : cut).replace(/[\s,.;:—-]+$/, '')}…`
}

/**
 * Метаданные страницы: заголовок и описание из «Для поисковиков», если заполнены,
 * иначе запасные; канонический адрес и картинка для соцсетей.
 */
export function pageMetadata({
  seo,
  title,
  description,
  path,
  image,
}: {
  seo?: Seo
  title: string
  description?: string | null
  path: string
  image?: string | null
}): Metadata {
  const finalTitle = seo?.title?.trim() || title
  const finalDescription = shortDescription(seo?.description || description)
  return {
    title: { absolute: finalTitle },
    description: finalDescription,
    alternates: { canonical: path },
    openGraph: {
      title: finalTitle,
      description: finalDescription,
      url: path,
      siteName: 'CAD.kz',
      locale: 'ru_KZ',
      type: 'website',
      ...(image ? { images: [image] } : {}),
    },
  }
}
