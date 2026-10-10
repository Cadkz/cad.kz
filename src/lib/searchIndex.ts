import type { Product } from '../../payload-types'
import { compareInSection, priorityRank } from '../domain/priority.mjs'
import type { SuggestEntry, SuggestIndex } from '../domain/suggest.mjs'
import { familyLines } from './families'
import { catalogHref } from './navigationHrefs'
import { cms } from './payload'
import { productPath } from './productPath'
import { relId } from './rel'
import { searchPages } from './siteNav'

/**
 * Индекс поиска по сайту из базы (каталог в неё перенесён из Битрикса импортом).
 * Это слой интеграции: подсказкам в шапке, странице поиска и будущему ИИ-помощнику не важно,
 * откуда данные. Сменится источник (например, прямой обмен с Битриксом) — меняется только этот файл.
 * Индекс держится в памяти сервера минуту: подсказки по ходу набора не нагружают базу.
 */

const KIND_LABEL: Record<Product['kind'], string> = {
  software: 'Программа',
  hardware: 'Оборудование',
  course: 'Курс',
  service: 'Услуга',
}
const GROUP_LABEL: Record<string, string> = {
  software: 'Программы',
  hardware: 'Оборудование',
  service: 'Услуги и обучение',
}
const TTL = 60_000
const published = { status: { equals: 'published' } } as const

let cached: { at: number; index: Promise<SuggestIndex> } | null = null

export function getSearchIndex(): Promise<SuggestIndex> {
  if (cached && Date.now() - cached.at < TTL) return cached.index
  const index = buildIndex()
  cached = { at: Date.now(), index }
  // Ошибка базы не должна залипнуть в памяти: следующий запрос попробует снова.
  index.catch(() => {
    cached = null
  })
  return index
}

async function buildIndex(): Promise<SuggestIndex> {
  const payload = await cms()
  const [products, manufacturers, sections, families] = await Promise.all([
    payload.find({
      collection: 'products',
      where: published,
      pagination: false,
      depth: 0,
      select: {
        title: true,
        slug: true,
        legacyUrl: true,
        kind: true,
        summary: true,
        searchAliases: true,
        tasks: true,
        manufacturer: true,
        priority: true,
        pageView: true,
        line: true,
        picker: true,
      },
    }),
    payload.find({
      collection: 'manufacturers',
      pagination: false,
      depth: 0,
      select: { title: true, priority: true },
    }),
    payload.find({
      collection: 'sections',
      where: published,
      pagination: false,
      sort: ['order', 'title'],
      depth: 0,
      select: { title: true, slug: true, menuGroup: true, isDirection: true, summary: true },
    }),
    familyLines(),
  ])

  const vendorTitle = new Map(manufacturers.docs.map((m) => [m.id, m.title]))
  const vendorLevel = new Map(manufacturers.docs.map((m) => [m.id, m.priority]))
  // Товар без своей страницы ведёт туда же, куда его старый адрес: в семейство или в подбор.
  const pickerParent = new Map<number, string>()
  for (const parent of products.docs) {
    if (parent.pageView !== 'picker') continue
    for (const step of parent.picker?.steps ?? [])
      for (const item of step.items ?? []) {
        const id = relId(item.product)
        if (id != null && !pickerParent.has(id))
          pickerParent.set(id, `${productPath(parent)}?pick=${id}`)
      }
  }

  const ranked = products.docs.flatMap((product) => {
    const vendorId = relId(product.manufacturer)
    const vendor = vendorId == null ? null : (vendorTitle.get(vendorId) ?? null)
    const lineId = relId(product.line)
    const family = lineId == null ? undefined : families.get(lineId)
    let href = productPath(product)
    if (product.pageView === 'none') {
      const target = family ? `${family.href}#${product.slug}` : pickerParent.get(product.id)
      if (!target) return []
      href = target
    }
    const entry: SuggestEntry = {
      type: 'product',
      title: product.title,
      href,
      label: KIND_LABEL[product.kind],
      note: family && product.pageView === 'none' ? family.title : vendor,
      vendor,
      aliases: product.searchAliases ?? null,
      summary: product.summary ?? null,
      tasks: (product.tasks ?? []).map((task) => task.title),
    }
    const rank = priorityRank(product.priority, vendorId == null ? null : vendorLevel.get(vendorId))
    return [{ entry, rank, vendor, main: null, title: product.title }]
  })
  // Топы продаж выше: при равном совпадении поиск сохраняет этот порядок.
  ranked.sort(compareInSection())
  const productEntries = ranked.map((item) => item.entry)

  const familyEntries: SuggestEntry[] = [...families.values()].map((family) => ({
    type: 'family',
    title: family.title,
    href: family.href,
    label: 'Семейство программ',
    note: family.vendor == null ? null : (vendorTitle.get(family.vendor) ?? null),
    vendor: family.vendor == null ? null : (vendorTitle.get(family.vendor) ?? null),
    summary: family.summary,
  }))

  const onSite = new Set(productEntries.map((entry) => entry.vendor).filter(Boolean))
  const vendors: SuggestEntry[] = manufacturers.docs
    .filter((m) => onSite.has(m.title))
    .map((m) => ({
      type: 'vendor',
      title: m.title,
      href: catalogHref({ vendor: m.title }),
      label: 'Производитель',
      note: 'Все товары производителя',
    }))

  const sectionEntries: SuggestEntry[] = sections.docs.map((section) => ({
    type: 'section',
    title: section.title,
    href: section.isDirection
      ? catalogHref({ direction: section.slug })
      : catalogHref({ group: section.menuGroup, type: section.slug }),
    label: 'Раздел каталога',
    note: GROUP_LABEL[section.menuGroup] ?? null,
  }))

  const pages: SuggestEntry[] = searchPages.map((page) => ({
    type: 'page',
    title: page.title,
    href: page.href,
    label: 'Страница сайта',
    summary: page.words,
  }))

  return {
    products: [...productEntries, ...familyEntries],
    vendors,
    sections: sectionEntries,
    pages,
  }
}
