import type { Section, SiteSetting } from '../../payload-types'
import { menuColumns } from '../domain/menu.mjs'
import { priorityRank } from '../domain/priority.mjs'
import { itemGroup, topSections, withTopSections } from '../domain/sectionTree.mjs'
import { familyLines } from './families'
import { catalogHref } from './navigationHrefs'
import { cms } from './payload'
import { productPath } from './productPath'

export type MenuLink = { title: string; href: string }
/** Линейка производителя в меню: первые товары и адрес каталога с этой линейкой. */
export type MenuLine = {
  key: string
  title: string
  links: MenuLink[]
  more: boolean
  allHref: string
}
export type MenuVendor = { key: string; title: string; allHref: string; lines: MenuLine[] }
/** Раздел в мегаменю: производители раздела по порядку и адрес каталога с этим разделом. */
export type MenuColumn = {
  title: string
  icon: string | null
  allHref: string
  vendors: MenuVendor[]
}
export type MenuTab = { key: string; label: string; columns: MenuColumn[]; allHref: string }

const groupLabels: Record<Section['menuGroup'], string> = {
  software: 'Программное обеспечение',
  hardware: 'Оборудование',
  service: 'Услуги',
}

const relId = (value: number | { id: number } | null | undefined) =>
  value == null ? null : typeof value === 'number' ? value : value.id

/**
 * Мегаменю строится из разделов, производителей, линеек и товаров CMS: новый товар сам появляется
 * в меню. Путь: раздел → производитель → линейка → товары (src/domain/menu.mjs).
 */
export async function getMenu(): Promise<MenuTab[]> {
  const payload = await cms()
  const [sections, products, manufacturers, lines] = await Promise.all([
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
    payload.find({
      collection: 'product-lines',
      where: { status: { equals: 'published' } },
      pagination: false,
      depth: 0,
      select: { title: true, manufacturer: true, order: true },
    }),
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

  // Товары без своей страницы в меню не показываются, их семейство — одной строкой в линейке.
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

  const lineData = lines.docs.map((line) => ({
    id: line.id,
    title: line.title,
    vendor: relId(line.manufacturer) ?? 0,
    order: line.order ?? 100,
  }))

  const tabs: MenuTab[] = (Object.keys(groupLabels) as Section['menuGroup'][]).map((group) => ({
    key: group,
    label: groupLabels[group],
    allHref: catalogHref({ group }),
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
      lineData,
      vendorTitle,
      catalogHref,
    ),
  }))

  // Отдельной вкладки «По отраслям» нет: направления и есть разделы программ.
  return tabs.filter((tab) => tab.columns.length > 0)
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
