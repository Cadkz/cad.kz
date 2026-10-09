import type { Product, Section, SiteSetting } from '../../payload-types'
import { catalogHref } from './navigationHrefs'
import { cms } from './payload'
import { productPath } from './productPath'

export type MenuLink = { title: string; href: string }
export type MenuColumn = { title: string; links: MenuLink[] }
export type MenuTab = { key: string; label: string; columns: MenuColumn[]; allHref: string }

const groupLabels: Record<Section['menuGroup'], string> = {
  software: 'Программное обеспечение',
  hardware: 'Оборудование',
  service: 'Услуги',
}

function sectionIds(product: Product) {
  return (product.sections ?? []).map((section) =>
    typeof section === 'number' ? section : section.id,
  )
}

/** Мегаменю строится из разделов и товаров CMS: новый товар сам появляется в меню. */
export async function getMenu(): Promise<MenuTab[]> {
  const payload = await cms()
  const [sections, products] = await Promise.all([
    payload.find({
      collection: 'sections',
      where: { status: { equals: 'published' } },
      sort: ['order', 'title'],
      limit: 200,
      depth: 0,
    }),
    payload.find({
      collection: 'products',
      where: { status: { equals: 'published' } },
      sort: 'title',
      limit: 500,
      depth: 0,
      select: { title: true, slug: true, legacyUrl: true, sections: true },
    }),
  ])

  const tabs: MenuTab[] = (Object.keys(groupLabels) as Section['menuGroup'][]).map((group) => ({
    key: group,
    label: groupLabels[group],
    allHref: catalogHref({ group }),
    columns: sections.docs
      .filter((section) => section.menuGroup === group)
      .map((section) => ({
        title: section.title,
        links: products.docs
          .filter((product) => sectionIds(product as Product).includes(section.id))
          .map((product) => ({ title: product.title, href: productPath(product) })),
      }))
      .filter((column) => column.links.length > 0),
  }))

  const directions = sections.docs.filter((section) => section.isDirection)
  tabs.push({
    key: 'directions',
    label: 'По отраслям',
    allHref: catalogHref(),
    columns: [
      {
        title: 'Направления',
        links: directions.map((section) => ({
          title: section.title,
          href: catalogHref({ direction: section.slug }),
        })),
      },
    ],
  })
  return tabs.filter((tab) => tab.columns.some((column) => column.links.length > 0))
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
