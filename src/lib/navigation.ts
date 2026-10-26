import type { SiteSetting } from '../../payload-types'
import { GROUP_LABELS } from '../domain/catalogNavigation.mjs'
import { type CatalogItem, type CatalogLine, clientItems, type Facet, getCatalog } from './catalog'
import { emptyFilter, results } from './catalogFilter'
import { catalogHref } from './navigationHrefs'
import { cms } from './payload'

export type MenuLogo = { url: string; width: number; height: number; local?: boolean }
export type MenuColumn = { title: string; allHref: string; items: CatalogItem[] }
export type MenuTab = {
  key: 'software' | 'hardware' | 'service'
  label: string
  allHref: string
  items: CatalogItem[]
  facets: Facet[]
  lines: CatalogLine[]
}

/** Все пути строятся из Payload. Производитель уточняет выдачу, а не скрывает её за папкой. */
export async function getMenu(): Promise<MenuTab[]> {
  const catalog = await getCatalog()
  const items = clientItems([...catalog.items, ...catalog.extras])
  return (Object.keys(GROUP_LABELS) as MenuTab['key'][])
    .filter((group) => results(items, { ...emptyFilter, group }).total > 0)
    .map((group) => ({
      key: group,
      label: GROUP_LABELS[group],
      allHref: catalogHref({ group }),
      items: items.filter((item) => item.group === group),
      facets: catalog.facets.filter((facet) => facet.group === group),
      lines: catalog.lines,
    }))
}

export type Contacts = {
  phones: { label: string; tel: string }[]
  whatsappHref: string | null
  telegramHref: string | null
  email: string | null
  socials: { network: string; url: string }[]
  footerText: string
  address: string | null
  hours: string | null
  mapUrl: string | null
}

/**
 * Мобильный номер из списка телефонов (код оператора 70x, 74x–77x; городские — 71x, 72x):
 * его показываем в меню и в блоках «Вопросы по…» (решение владельца 13.10.2026). Нет мобильного —
 * первый из списка.
 */
export function mobilePhone(phones: Contacts['phones']): Contacts['phones'][number] | null {
  const mobile = phones.find((phone) => /^7[04567]/.test(phone.tel.replace(/\D/g, '').slice(1)))
  return mobile ?? phones[0] ?? null
}

export async function getContacts(): Promise<Contacts> {
  const payload = await cms()
  const settings: SiteSetting = await payload.findGlobal({ slug: 'site-settings', depth: 0 })
  const digits = settings.whatsapp?.replace(/\D/g, '')
  return {
    phones: (settings.phones ?? []).map(({ label, tel }) => ({ label, tel })),
    whatsappHref: digits ? `https://wa.me/${digits}` : null,
    telegramHref: settings.telegram || null,
    email: settings.email || null,
    socials: (settings.socials ?? []).map(({ network, url }) => ({ network, url })),
    footerText: settings.footerText ?? '',
    address: settings.address || null,
    hours: settings.hours || null,
    mapUrl: settings.mapUrl || null,
  }
}
