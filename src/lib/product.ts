import type { Metadata } from 'next'
import type { Product, Section } from '../../payload-types'
import { type Scan, scanById } from '../domain/artecScans.mjs'
import { resolveScenario, type Scenario } from '../domain/buyScenario.mjs'
import { keyFacts } from '../domain/keyFacts.mjs'
import type { PickerView } from '../domain/picker.mjs'
import { cleanSpecs } from '../domain/specs.mjs'
import { type Lifecycle, lifecycle, readResearch } from './equipmentResearch'
import { formatKzt } from './format'
import { cms } from './payload'
import { loadPicker } from './picker'
import { type Picture, productPictures, toPicture } from './pictures'
import { loadPricingContext, quoteOffer } from './pricing'
import { productPath } from './productPath'
import { relId } from './rel'
import { pageMetadata } from './seo'

/** Служебные характеристики: в базе нужны для прайсов и 1С, покупателю не показываются. */
const HIDDEN_PROPERTIES = new Set(['артикул'])

export type ProductOffer = {
  id: string
  configuration: string
  license: string
  /** Цена за единицу, рассчитанная сервером, или null, если курс не задан. */
  price: string | null
}

export type Spec = ReturnType<typeof cleanSpecs>[number]
export type Fact = ReturnType<typeof keyFacts>[number]

export type RelatedProduct = { slug: string; href: string; title: string; vendor: string | null }

export type ProductPage = {
  lifecycle?: Lifecycle | null
  id: number
  slug: string
  /** Адрес страницы: прежний адрес cad.kz, если товар там был. */
  path: string
  title: string
  kind: Product['kind']
  summary: string | null
  description: string | null
  vendor: string | null
  sections: { slug: string; title: string; isDirection: boolean; icon: string | null }[]
  tasks: string[]
  /** Характеристики для показа: по-русски, без повторов, группа отдельно (src/domain/specs.mjs). */
  properties: Spec[]
  /** Главные факты категории для сцены первого экрана (src/domain/keyFacts.mjs). */
  facts: Fact[]
  faq: { question: string; answer: string }[]
  requires: RelatedProduct[]
  offers: ProductOffer[]
  /** Вид страницы: обычная, с подбором или без своей страницы (тогда адрес перенаправляется). */
  pageView: Product['pageView']
  /** Подбор комплекта; у обычной страницы — один шаг из своих предложений. */
  picker: PickerView
  renewLabel: string | null
  /** Сценарий покупки (src/domain/buyScenario.mjs): от него кнопки итога. */
  scenario: Scenario
  /** У основного раздела включена запись на демонстрацию (сканеры). */
  demo: boolean
  /** Линейка и производитель: куда вести адрес товара без своей страницы. */
  lineId: number | null
  vendorId: number | null
  /** Товар без своей страницы: куда вести с его адреса («Куда вести со старого адреса»). */
  redirectId: number | null
  /** Своя галерея или картинка производителя; пусто — блока картинок нет. */
  pictures: Picture[]
  /**
   * Фото для сцены первого экрана: «Картинка для карточки» в PNG или WebP — вырезанное фото на
   * прозрачном или белом фоне (фото владельца, 23.10.2026). JPEG с серым фоном в сцену не берём.
   */
  stagePicture: Picture | null
  /** Примеры сканов (админка: товар → «Примеры сканов»), только у оборудования. */
  scans: Scan[]
  seo: Product['seo']
}

function related(value: Product['recommended']): RelatedProduct[] {
  return (value ?? [])
    .filter((item): item is Product => typeof item !== 'number' && item.status === 'published')
    .map((item) => ({
      slug: item.slug,
      href: productPath(item),
      title: item.title,
      vendor:
        item.manufacturer && typeof item.manufacturer !== 'number' ? item.manufacturer.title : null,
    }))
}

/** Товар для полной страницы: предложения с серверной ценой, связи, характеристики. */
export async function getProduct(slug: string): Promise<ProductPage | null> {
  const payload = await cms()
  const { docs } = await payload.find({
    collection: 'products',
    where: { and: [{ status: { equals: 'published' } }, { slug: { equals: slug } }] },
    limit: 1,
    depth: 2,
  })
  const product = docs[0]
  if (!product) return null
  const research = readResearch(product.researchData)
  const specs = cleanSpecs(
    (product.properties ?? []).filter(
      ({ name }) => !HIDDEN_PROPERTIES.has(name.trim().toLowerCase()),
    ),
  )
  const replacements = new Map<string, { title: string; href: string | null }>()
  if (research?.status === 'discontinued' && research.replacedBy) {
    const { docs } = await payload.find({
      collection: 'products',
      where: {
        and: [{ slug: { equals: research.replacedBy } }, { status: { equals: 'published' } }],
      },
      limit: 1,
      depth: 0,
    })
    for (const entry of docs)
      replacements.set(entry.slug, {
        title: entry.title,
        href: entry.pageView !== 'none' ? productPath(entry) : null,
      })
  }
  const main = typeof product.mainSection === 'object' ? product.mainSection : null
  // Подраздел без своих настроек берёт сценарий и демонстрацию у родителя.
  const parent = main && typeof main.parent === 'object' ? main.parent : null
  const [offers, context, picker] = await Promise.all([
    payload.find({
      collection: 'offers',
      where: { and: [{ status: { equals: 'published' } }, { product: { equals: product.id } }] },
      limit: 100,
      depth: 0,
    }),
    loadPricingContext(payload),
    loadPicker(payload, product),
  ])
  const priced = offers.docs
    .map((offer) => {
      let unit: string | null = null
      try {
        unit = quoteOffer(offer, context).unitKzt
      } catch {
        unit = null
      }
      return { offer, unit }
    })
    .sort((a, b) => Number(BigInt(a.unit ?? '0') - BigInt(b.unit ?? '0')))

  return {
    id: product.id,
    slug: product.slug,
    path: productPath(product),
    title: product.title,
    kind: product.kind,
    summary: product.summary ?? null,
    lifecycle: lifecycle(research, replacements),
    description: product.description ?? null,
    vendor:
      product.manufacturer && typeof product.manufacturer !== 'number'
        ? product.manufacturer.title
        : null,
    sections: (product.sections ?? [])
      .filter((section): section is Section => typeof section !== 'number')
      .map((section) => ({
        slug: section.slug,
        title: section.title,
        isDirection: Boolean(section.isDirection),
        icon: section.icon ?? null,
      })),
    tasks: (product.tasks ?? []).map((task) => task.title),
    properties: specs,
    facts: keyFacts(research, specs),
    faq: (product.faq ?? []).map(({ question, answer }) => ({ question, answer })),
    requires: related(product.requiresProducts),
    offers: priced.map(({ offer, unit }) => ({
      id: String(offer.id),
      configuration: offer.configuration,
      license: offer.license,
      price: unit ? formatKzt(unit) : null,
    })),
    pageView: product.pageView ?? 'standard',
    picker,
    renewLabel: product.renewLabel || null,
    scenario: resolveScenario({
      own: product.scenario,
      section: main?.scenario ?? parent?.scenario,
      kind: product.kind,
    }),
    demo: Boolean(main?.demoButton ?? parent?.demoButton),
    lineId: relId(product.line),
    vendorId: relId(product.manufacturer),
    redirectId: relId(product.redirectTo),
    pictures: productPictures(product),
    stagePicture: stagePicture(product),
    scans: product.kind === 'hardware' ? productScans(product) : [],
    seo: product.seo,
  }
}

/** Заголовок, описание и канонический адрес страницы товара. Перенесённые со старого сайта — первыми. */
export function productMetadata(product: ProductPage): Metadata {
  return pageMetadata({
    seo: product.seo,
    title: `${product.title} — купить в CAD.kz`,
    description: product.summary ?? product.description,
    path: product.path,
    image: product.pictures[0]?.url,
  })
}

/** Что выбрать в подборе сразу: ID товара (число) или ключ варианта подбора (строка). */
export type PickTarget = number | string

type Params = Record<string, string | string[] | undefined>
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)

/**
 * Выбор из адреса: ?pick=ID — старый адрес варианта ведёт на подбор с уже выбранным вариантом;
 * ?item=ключ — карточка пакета в каталоге открывает подбор с этим пакетом.
 */
export function pickParam(params: Params): PickTarget | null {
  const item = first(params.item)
  if (item && /^[\w-]{1,64}$/.test(item)) return item
  const id = Number(first(params.pick))
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

/** Прозрачный фон бывает только у PNG и WebP: из них фото в сцене смотрится вырезанным. */
const CUTOUT_TYPES = new Set(['image/png', 'image/webp'])

function stagePicture(product: Product): Picture | null {
  if (product.kind !== 'hardware') return null
  const media = product.cardImage
  if (!media || typeof media === 'number' || !CUTOUT_TYPES.has(media.mimeType ?? '')) return null
  return toPicture(media, product.title)
}

/** Сканы из админки по порядку; своя подпись заменяет подпись из библиотеки. */
function productScans(product: Product): Scan[] {
  return (product.scans ?? []).flatMap((entry) => {
    const scan = scanById(entry.scan)
    return scan ? [{ ...scan, title: entry.title?.trim() || scan.title }] : []
  })
}
