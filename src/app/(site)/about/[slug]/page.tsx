import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound, permanentRedirect } from 'next/navigation'
import { InfoPageView, infoPageMetadata } from '@/components/InfoPageView/InfoPageView'
import { INFO_PAGES } from '@/domain/legacyPages.mjs'
import { LEGACY_PATH_HEADER } from '@/domain/legacyRoutes.mjs'
import { resolveLegacy } from '@/lib/legacy'

type Props = { params: Promise<{ slug: string }> }

/** Подстраницы «О компании» из списка INFO_PAGES. */
const allowed = new Set(INFO_PAGES.map((page) => page.slug).filter((slug) => slug !== 'about'))

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return allowed.has(slug) ? infoPageMetadata(slug) : {}
}

/**
 * Текстовая страница или старый адрес вида /about/news/, /about/team/: такие этот маршрут
 * перехватывает раньше страницы старых адресов, поэтому решаем их здесь теми же правилами.
 */
export default async function InfoPage({ params }: Props) {
  const { slug } = await params
  if (allowed.has(slug)) return <InfoPageView slug={slug} />
  const original = (await headers()).get(LEGACY_PATH_HEADER) ?? `/about/${slug}`
  const resolution = await resolveLegacy(original)
  if (resolution && 'redirect' in resolution) permanentRedirect(resolution.redirect)
  notFound()
}
