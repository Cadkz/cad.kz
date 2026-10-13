import type { HomePage, Section, SiteSetting } from '../../payload-types'
import { brandOf } from '../domain/brands.mjs'
import { menuColumns, menuTitle } from '../domain/menu.mjs'
import { priorityRank } from '../domain/priority.mjs'
import { itemGroup, topSections, withTopSections } from '../domain/sectionTree.mjs'
import { familyLines } from './families'
import { catalogHref } from './navigationHrefs'
import { cms } from './payload'
import type { PopularCardData } from './popular'
import { productPath } from './productPath'

/** Программа в меню: название, пояснение после тире, производитель. */
export type MenuProgram = {
  title: string
  note: string | null
  vendor: string | null
  href: string
}
/** Раздел в мегаменю: программы раздела по приоритету. */
export type MenuColumn = {
  title: string
  icon: string | null
  allHref: string
  programs: MenuProgram[]
  /** В разделе программ больше, чем в меню: показать «Все программы раздела». */
  more: boolean
}
export type MenuTab = {
  key: string
  label: string
  columns: MenuColumn[]
  allHref: string
  /** Ссылка на всю группу в одну строку: «Все программы». */
  allLabel: string
}
export type Menu = {
  tabs: MenuTab[]
  /** «Популярные программы» — те же плитки, что на главной (админка → «Главная страница»). */
  popular: PopularCardData[]
}

const groupLabels: Record<Section['menuGroup'], string> = {
  software: 'Программное обеспечение',
  hardware: 'Оборудование',
  service: 'Услуги',
}

const groupAll: Record<Section['menuGroup'], string> = {
  software: 'Все программы',
  hardware: 'Всё оборудование',
  service: 'Все услуги',
}

const relId = (value: number | { id: number } | null | undefined) =>
  value == null ? null : typeof value === 'number' ? value : value.id

/** «Популярные программы» в меню: товар или своя ссылка из админки, фирменный логотип по названию. */
function menuPopular(
  items: NonNullable<HomePage['popular']>['items'],
  products: Map<number, { title: string; href: string }>,
): PopularCardData[] {
  return (items ?? []).flatMap((item, index) => {
    const id = relId(item.product)
    const product = id == null ? undefined : products.get(id)
    const href = item.href || product?.href
    const title = item.title || (product ? menuTitle(product.title) : null)
    if (!href || !title) return []
    const brand = brandOf(title)
    return [
      {
        key: item.id ?? String(index),
        title,
        href,
        picture: null,
        icon: null,
        brand: brand ? { key: brand.key, logo: brand.logo } : null,
      },
    ]
  })
}

/**
 * Мегаменю строится из разделов, производителей и товаров CMS: новый товар сам появляется в меню.
 * Вариант А (13.10.2026): раздел по задаче → сразу его программы; популярные программы — плитками
 * из блока главной; все производители — отдельной вкладкой (src/domain/menu.mjs).
 */
export async function getMenu(): Promise<Menu> {
  const payload = await cms()
  const [sections, products, manufacturers, home] = await Promise.all([
    payload.find({
      collection: 'sections',
      where: { status: { equals: 'published' } },
      sort: ['order', 'title'],
      pagination: false,
      depth: 0,
    }),
    payload.find({
      collection: 'products',
      where: { status: { equals: 'published' } },
      sort: 'title',
      pagination: false,
      depth: 0,
      select: {
        title: true,
        slug: true,
        legacyUrl: true,
        sections: true,
        mainSection: true,
        manufacturer: true,
        priority: true,
        line: true,
        lineOrder: true,
        pageView: true,
        kind: true,
      },
    }),
    payload.find({
      collection: 'manufacturers',
      pagination: false,
      depth: 0,
      select: { priority: true, title: true },
    }),
    payload.findGlobal({ slug: 'home-page', depth: 0, select: { popular: true } }),
  ])

  // Подразделы видны через верхний раздел (src/domain/sectionTree.mjs).
  const top = topSections(sections.docs.map((s) => ({ id: s.id, parent: relId(s.parent) })))
  const groupOf = new Map(sections.docs.map((s) => [s.id, s.menuGroup]))
  const vendorLevel = new Map(manufacturers.docs.map((m) => [m.id, m.priority]))
  const vendorTitle = new Map(manufacturers.docs.map((m) => [m.id, m.title]))
  const items = products.docs.map((product) => {
    const vendor = relId(product.manufacturer)
    const main = relId(product.mainSection)
    const topMain = main == null ? null : (top.get(main) ?? main)
    return {
      id: product.id,
      title: product.title,
      main: topMain,
      sections: withTopSections(
        (product.sections ?? []).map((section) => relId(section) ?? 0),
        top,
      ),
      href: productPath(product),
      vendor,
      line: relId(product.line),
      lineOrder: product.lineOrder ?? null,
      rank: priorityRank(product.priority, vendor == null ? null : vendorLevel.get(vendor)),
      group: itemGroup(product.kind, topMain == null ? null : groupOf.get(topMain)),
    }
  })

  // Товары без своей страницы в меню не показываются, их семейство — одной строкой.
  const families = await familyLines()
  const hidden = new Set(products.docs.filter((p) => p.pageView === 'none').map((p) => p.id))
  const familyItems = [...families].flatMap(([lineId, family]) => {
    const members = items.filter((item) => item.line === lineId)
    const [first] = members
    if (!first) return []
    return [
      {
        ...first,
        id: -lineId,
        title: family.title,
        href: family.href,
        sections: [...new Set(members.flatMap((m) => m.sections))],
        lineOrder: 0,
        rank: Math.max(...members.map((m) => m.rank)),
      },
    ]
  })
  const menuItems = [...items.filter((item) => !hidden.has(item.id)), ...familyItems]

  const tabs: MenuTab[] = (Object.keys(groupLabels) as Section['menuGroup'][]).map((group) => ({
    key: group,
    label: groupLabels[group],
    allHref: catalogHref({ group }),
    allLabel: groupAll[group],
    columns: menuColumns(
      sections.docs
        .filter((section) => section.menuGroup === group && relId(section.parent) == null)
        .map(({ id, slug, title, menuGroup, isDirection, pinnedManufacturers, icon }) => ({
          id,
          icon: icon ?? null,
          slug,
          title,
          menuGroup,
          isDirection: Boolean(isDirection),
          pins: (pinnedManufacturers ?? []).map((m) => relId(m) ?? 0),
        })),
      menuItems,
      vendorTitle,
      catalogHref,
    ),
  }))

  const byId = new Map(items.map((item) => [item.id, item]))
  return {
    // Отдельной вкладки «По отраслям» нет: направления и есть разделы программ.
    tabs: tabs.filter((tab) => tab.columns.length > 0),
    popular: menuPopular(home.popular?.items, byId),
  }
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
