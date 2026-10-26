import { cache } from 'react'
import { getCatalog } from './catalog'
import { browseState, fromSearch, results } from './catalogFilter'
import { cms } from './payload'
import { type PopularCardData, popularCards } from './popular'
import { relId } from './rel'

/** Список популярных берётся из настроек главной, вид и цены — из общего каталога. */
export const getMenuPopular = cache(async (): Promise<PopularCardData[]> => {
  const payload = await cms()
  const [page, catalog] = await Promise.all([
    payload.findGlobal({ slug: 'home-page', depth: 0 }),
    getCatalog(),
  ])
  const items = (page.popular?.items ?? []).map((item) => ({
    key: item.id ?? `${item.title}-${item.href}`,
    productId: relId(item.product),
    title: item.title ?? null,
    href: item.href ?? null,
  }))
  const cards = popularCards(items, catalog.items)
  return cards.map((card) => {
    const source = catalog.items.find((item) => item.href === card.href)
    const selection = card.href.startsWith('/catalog')
      ? results(
          catalog.items,
          browseState(fromSearch(card.href.split('?')[1] ?? ''), catalog.facets, false),
        ).items
      : []
    const picture =
      card.picture ??
      selection.find((item) => item.picture)?.picture ??
      (card.brand
        ? {
            url: card.brand.logo,
            width: 80,
            height: 80,
            alt: '',
            fit: 'logo' as const,
            local: true,
          }
        : null)
    return {
      ...card,
      product: source ?? {
        id: 0,
        href: card.href,
        title: card.title,
        picture,
        icon: card.icon,
        manufacturer: null,
        summary: selection.length
          ? selection
              .slice(0, 3)
              .map((item) => item.title)
              .join(' · ')
          : 'Посмотреть доступные варианты',
        entryType: 'Линейка',
        priceFrom: null,
        offersCount: 0,
        cartOfferId: null,
        badge: null,
      },
    }
  })
})
