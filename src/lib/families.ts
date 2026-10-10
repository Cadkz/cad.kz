import type { Metadata } from 'next'
import { EXTRA_ORDER } from '@/domain/familySeed.mjs'
import type { PickerView } from '@/domain/picker.mjs'
import type { ProductLine } from '../../payload-types'
import { cms } from './payload'
import { offersOf, pickerOffers } from './picker'
import { loadPricingContext } from './pricing'
import { productPath } from './productPath'
import { relId } from './rel'
import { pageMetadata } from './seo'

const published = { status: { equals: 'published' } } as const

/** Название вида «АРБАТ - экспертиза …» → коротко «АРБАТ» и пояснение «Экспертиза …». */
export function splitTitle(title: string): { label: string; note: string | null } {
  const match = /^(.{2,40}?)\s+[-–—]\s+(.+)$/.exec(title)
  if (!match) return { label: title, note: null }
  const [, label = title, rest = ''] = match
  return { label, note: rest.charAt(0).toUpperCase() + rest.slice(1) }
}

export type FamilyMember = {
  id: number
  slug: string
  title: string
  description: string | null
  /** Продление, обновление или пакет лицензий: в свёрнутом блоке внизу. */
  extra: boolean
  /** Своя страница, если у товара она есть (вид не «Без своей страницы»). */
  href: string | null
}

export type FamilyPage = {
  id: number
  slug: string
  title: string
  intro: string | null
  /** Кнопка «Обновить версию» в итоге: заявка менеджеру без корзины. */
  renewLabel: string | null
  vendor: string | null
  seo: ProductLine['seo']
  members: FamilyMember[]
  picker: PickerView
}

/** Страница семейства: опубликованная линейка с галочкой «Своя страница семейства». */
export async function getFamily(slug: string): Promise<FamilyPage | null> {
  const payload = await cms()
  const { docs } = await payload.find({
    collection: 'product-lines',
    where: { and: [published, { familyPage: { equals: true } }, { slug: { equals: slug } }] },
    limit: 1,
    depth: 1,
  })
  const line = docs[0]
  if (!line?.slug) return null
  const products = await payload.find({
    collection: 'products',
    where: { and: [published, { line: { equals: line.id } }] },
    sort: ['lineOrder', 'title'],
    pagination: false,
    depth: 0,
    select: {
      title: true,
      slug: true,
      legacyUrl: true,
      description: true,
      pageView: true,
      lineOrder: true,
    },
  })
  const [offers, context] = await Promise.all([
    offersOf(
      payload,
      products.docs.map((p) => p.id),
    ),
    loadPricingContext(payload),
  ])
  const members = products.docs.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    description: p.description ?? null,
    extra: (p.lineOrder ?? 0) >= EXTRA_ORDER,
    href: p.pageView === 'none' ? null : productPath(p),
  }))
  const item = (m: FamilyMember) => {
    const { label, note } = splitTitle(m.title)
    return {
      key: `p${m.id}`,
      productId: m.id,
      label,
      note,
      offers: pickerOffers(offers.get(m.id) ?? [], context),
      fixedOffers: [],
      preselect: false,
      anchor: m.slug,
    }
  }
  const main = members.filter((m) => !m.extra)
  const extra = members.filter((m) => m.extra)
  const picker: PickerView = {
    switches: [],
    steps: [
      ...(main.length
        ? [
            {
              key: 'family',
              title: 'Программы',
              hint: 'Отметьте нужные — менеджер пришлёт коммерческое предложение на отмеченное.',
              mode: 'many' as const,
              collapsed: false,
              items: main.map(item),
            },
          ]
        : []),
      ...(extra.length
        ? [
            {
              key: 'family-extra',
              title: 'Продление, обновление и пакеты лицензий',
              hint: 'Если программа уже куплена: продление, переход с прежней версии, доп. места.',
              mode: 'many' as const,
              collapsed: main.length > 0,
              items: extra.map(item),
            },
          ]
        : []),
    ],
  }
  const vendor =
    line.manufacturer && typeof line.manufacturer !== 'number' ? line.manufacturer : null
  return {
    id: line.id,
    slug: line.slug,
    title: line.title,
    intro: line.intro ?? line.summary ?? null,
    renewLabel: line.renewLabel || null,
    vendor: vendor?.title ?? null,
    seo: line.seo,
    members,
    picker,
  }
}

/** Семейства для каталога и меню: линейка → адрес страницы. */
export async function familyLines() {
  const payload = await cms()
  const { docs } = await payload.find({
    collection: 'product-lines',
    where: { and: [published, { familyPage: { equals: true } }, { slug: { exists: true } }] },
    pagination: false,
    depth: 0,
    select: { title: true, slug: true, summary: true, intro: true, manufacturer: true },
  })
  return new Map(
    docs.flatMap((line) =>
      line.slug
        ? [
            [
              line.id,
              {
                title: line.title,
                href: `/families/${line.slug}`,
                summary: line.summary ?? line.intro ?? null,
                vendor: relId(line.manufacturer),
              },
            ] as const,
          ]
        : [],
    ),
  )
}

export function familyMetadata(family: FamilyPage): Metadata {
  return pageMetadata({
    seo: family.seo ?? undefined,
    title: `${family.title}${family.vendor ? ` ${family.vendor}` : ''} — купить в CAD.kz`,
    description: family.intro,
    path: `/families/${family.slug}`,
  })
}
