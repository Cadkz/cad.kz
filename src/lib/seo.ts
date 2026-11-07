import type { Metadata } from 'next'
import {
  DEFAULT_LANG,
  INDEX_TRANSLATIONS,
  type Lang,
  langAlternates,
  localizeHref,
  OG_LOCALES,
} from '@/i18n/locales.mjs'
import { requestLang } from '@/i18n/server'

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

/** Картинка для соцсетей по умолчанию (1200×630): у страниц без своей обложки. */
export const DEFAULT_SHARE_IMAGE = '/images/brand/og-default.png'

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
 * Канонический адрес, hreflang и запрет индексации для языковых версий. langs — языки, на которых
 * страница переведена (русский всегда). Пока казахская и английская версии закрыты
 * (INDEX_TRANSLATIONS = false) — канонический адрес русский, как раньше. Открыты — переведённая
 * страница ссылается сама на себя и на свои версии; непереведённая закрыта от индексации и
 * указывает на русскую.
 */
export function langMetadata(
  path: string,
  lang: Lang,
  langs: readonly Lang[],
): Pick<Metadata, 'alternates' | 'robots'> {
  const russian = localizeHref(DEFAULT_LANG, path)
  if (!INDEX_TRANSLATIONS) return { alternates: { canonical: russian } }
  const ready = lang === DEFAULT_LANG || langs.includes(lang)
  const languages = langs.some((item) => item !== DEFAULT_LANG)
    ? langAlternates(path, langs)
    : undefined
  return {
    alternates: { canonical: ready ? localizeHref(lang, path) : russian, languages },
    ...(ready ? {} : { robots: { index: false, follow: isProduction() } }),
  }
}

/** Все языки: страницы, где переведён весь текст (интерфейс и настройки с переводами). */
export const ALL_LANGS: readonly Lang[] = ['ru', 'kk', 'en']
/** Только русский: тексты из базы без проверки переводов (семейства). Новости и страницы — src/lib/contentLangs.ts. */
export const RU_ONLY: readonly Lang[] = ['ru']

/**
 * Метаданные страницы: заголовок и описание из «Для поисковиков», если заполнены,
 * иначе запасные; канонический адрес, языковые версии и картинка для соцсетей.
 */
export async function pageMetadata({
  seo,
  title,
  description,
  path,
  image,
  langs,
}: {
  seo?: Seo
  title: string
  description?: string | null
  path: string
  image?: string | null
  /** На каких языках страница переведена — их версии открываются поисковикам. */
  langs: readonly Lang[]
}): Promise<Metadata> {
  const lang = await requestLang()
  const finalTitle = seo?.title?.trim() || title
  const finalDescription = shortDescription(seo?.description || description)
  return {
    title: { absolute: finalTitle },
    description: finalDescription,
    ...langMetadata(path, lang, langs),
    openGraph: {
      title: finalTitle,
      description: finalDescription,
      url: localizeHref(lang, path),
      siteName: 'CAD.kz',
      locale: OG_LOCALES[lang],
      type: 'website',
      images: [image || DEFAULT_SHARE_IMAGE],
    },
  }
}
