import type { Section, SiteSetting } from '../../payload-types'
import { GROUP_LABELS } from '../domain/catalogNavigation.mjs'
import { courseTopic } from '../domain/courseTopics.mjs'
import { menuColumns } from '../domain/menu.mjs'
import { priorityRank } from '../domain/priority.mjs'
import { itemGroup, topSections, withTopSections } from '../domain/sectionTree.mjs'
import { catalogAvailable } from './equipmentResearch'
import { familyLines } from './families'
import { catalogHref } from './navigationHrefs'
import { cms } from './payload'
import { vendorPictures } from './pictures'
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
/** Логотип производителя в меню — тот же, что у плитки производителя в каталоге. */
export type MenuLogo = { url: string; width: number; height: number; local?: boolean }
/**
 * Карточка первого шага раздела: производитель (логотип и название), подраздел оборудования
 * или категория курсов (значок и название). Без перечисления того, что внутри (27.10.2026).
 */
export type MenuVendor = {
  key: string
  title: string
  allHref: string
  lines: MenuLine[]
  logo: MenuLogo | null
  icon: string | null
}
/** Раздел в мегаменю: производители раздела по порядку и адрес каталога с этим разделом. */
export type MenuColumn = {
  title: string
  icon: string | null
  allHref: string
  vendors: MenuVendor[]
  /** Первые товары раздела по приоритету: строкой под карточками производителей. */
  popular: MenuLink[]
}
export type MenuTab = { key: string; label: string; columns: MenuColumn[]; allHref: string }

/** Те же названия, что у вкладок на странице каталога (src/domain/catalogNavigation.mjs). */
const groupLabels: Record<Section['menuGroup'], string> = GROUP_LABELS

/** Раздел для меню: только то, что нужно menuColumns. */
const menuSection = ({
  id,
  slug,
  title,
  menuGroup,
  isDirection,
  pinnedManufacturers,
  icon,
}: Section) => ({
  id,
  icon: icon ?? null,
  slug,
  title,
  menuGroup,
  isDirection: Boolean(isDirection),
  pins: (pinnedManufacturers ?? []).map((m) => relId(m) ?? 0),
})

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
        topOrder: true,
        line: true,
        lineOrder: true,
        pageView: true,
        kind: true,
        status: true,
        researchData: true,
      },
    }),
    payload.find({
      collection: 'manufacturers',
      pagination: false,
      depth: 0,
      select: { priority: true, title: true, order: true, logo: true, image: true },
    }),
    payload.find({
      collection: 'product-lines',
      where: { status: { equals: 'published' } },
      pagination: false,
      depth: 0,
      select: { title: true, manufacturer: true, order: true },
    }),
  ])

  const logos = new Map(
    [...(await vendorPictures(payload, manufacturers.docs))].map(([title, picture]) => [
      title,
      { url: picture.url, width: picture.width, height: picture.height, local: picture.local },
    ]),
  )
  const directionSlug = new Map(
    sections.docs.filter((s) => s.isDirection).map((s) => [s.id, s.slug]),
  )
  // Подразделы видны через верхний раздел (src/domain/sectionTree.mjs).
  const top = topSections(sections.docs.map((s) => ({ id: s.id, parent: relId(s.parent) })))
  const groupOf = new Map(sections.docs.map((s) => [s.id, s.menuGroup]))
  const vendorLevel = new Map(manufacturers.docs.map((m) => [m.id, m.priority]))
  const vendorTitle = new Map(manufacturers.docs.map((m) => [m.id, m.title]))
  const vendorOrder = new Map(manufacturers.docs.map((m) => [m.id, m.order ?? null]))
  // Снятые с производства модели не показываются, как и в каталоге (решение владельца 23.10.2026).
  const items = products.docs.filter(catalogAvailable).map((product) => {
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
      vendorOrder: vendor == null ? null : (vendorOrder.get(vendor) ?? null),
      rank: priorityRank(
        product.priority,
        vendor == null ? null : vendorLevel.get(vendor),
        product.topOrder,
      ),
      group: itemGroup(product.kind, topMain == null ? null : groupOf.get(topMain)),
      // Категория курса — как в каталоге (src/domain/courseTopics.mjs).
      ...(product.kind === 'course'
        ? {
            topic: courseTopic(
              product.title,
              (product.sections ?? []).flatMap((section) => {
                const slug = directionSlug.get(relId(section) ?? 0)
                return slug ? [slug] : []
              }),
            ).key,
          }
        : {}),
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
        .map((section) => ({
          ...menuSection(section),
          // Подразделы («Плоттеры», «Расходные материалы») — шагом в меню, как плитки в каталоге.
          children: sections.docs
            .filter((child) => relId(child.parent) === section.id)
            .map(menuSection),
        })),
      menuItems,
      lineData,
      vendorTitle,
      catalogHref,
      undefined,
      logos,
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
