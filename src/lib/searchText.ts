import { cms } from './payload'
import { relId } from './rel'

/**
 * Что ещё видит поиск у товара, кроме названия и анонса (src/domain/search.mjs):
 * - sections — названия разделов каталога, основной первым («Плоттеры», «3D-сканеры»);
 * - parts — названия программ в составе: варианты подбора (у GEO5 — все модули);
 * - keywords — описание, характеристики (кроме артикула), кнопка продления.
 * У семейства: разделы и названия всех его программ.
 * Держится в памяти сервера минуту, как индекс подсказок: в карточки каталога это не попадает,
 * чтобы не утяжелять страницы.
 */
export type SearchExtra = { sections: string[]; parts: string; keywords: string }

const TTL = 60_000
const published = { status: { equals: 'published' } } as const
/** Описание длиннее — хвост поиску почти ничего не даёт, а память занимает. */
const DESCRIPTION_LIMIT = 4000
const HIDDEN_PROPERTIES = new Set(['артикул'])

type Extras = { products: Map<number, SearchExtra>; families: Map<number, SearchExtra> }
let cached: { at: number; extras: Promise<Extras> } | null = null

export function getSearchExtras(): Promise<Extras> {
  if (cached && Date.now() - cached.at < TTL) return cached.extras
  const extras = loadExtras()
  cached = { at: Date.now(), extras }
  extras.catch(() => {
    cached = null
  })
  return extras
}

/** Ссылки и разметка описания поиску не нужны: «https», «cad», «kz» — не слова о товаре. */
function plainText(text: string): string {
  return text
    .slice(0, DESCRIPTION_LIMIT)
    .replace(/\]\([^)]*\)/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ')
}

async function loadExtras(): Promise<Extras> {
  const payload = await cms()
  const [products, sections] = await Promise.all([
    payload.find({
      collection: 'products',
      where: published,
      pagination: false,
      depth: 0,
      select: {
        title: true,
        line: true,
        sections: true,
        mainSection: true,
        description: true,
        properties: true,
        renewLabel: true,
        picker: true,
      },
    }),
    payload.find({
      collection: 'sections',
      where: published,
      pagination: false,
      depth: 0,
      select: { title: true },
    }),
  ])
  const sectionTitle = new Map(sections.docs.map((section) => [section.id, section.title]))
  const titleById = new Map(products.docs.map((product) => [product.id, product.title]))

  const result: Extras = { products: new Map(), families: new Map() }
  const members = new Map<number, { titles: string[]; sections: Set<string> }>()
  for (const product of products.docs) {
    const main = relId(product.mainSection)
    const ids = [main, ...(product.sections ?? []).map(relId).filter((id) => id !== main)]
    const titles = ids.flatMap((id) => {
      const title = id == null ? undefined : sectionTitle.get(id)
      return title ? [title] : []
    })
    const parts = (product.picker?.steps ?? []).flatMap((step) =>
      (step.items ?? []).flatMap((item) => {
        const id = relId(item.product)
        const title = id == null ? undefined : titleById.get(id)
        return title ? [title] : []
      }),
    )
    const properties = (product.properties ?? [])
      .filter(({ name }) => !HIDDEN_PROPERTIES.has(name.trim().toLowerCase()))
      .map(({ name, value }) => `${name} ${value}`)
    result.products.set(product.id, {
      sections: [...new Set(titles)],
      parts: [...new Set(parts)].join(' '),
      keywords: [plainText(product.description ?? ''), ...properties, product.renewLabel ?? '']
        .join(' ')
        .trim(),
    })
    const line = relId(product.line)
    if (line == null) continue
    const family = members.get(line) ?? { titles: [], sections: new Set<string>() }
    family.titles.push(product.title)
    for (const title of titles) family.sections.add(title)
    members.set(line, family)
  }
  for (const [line, family] of members)
    result.families.set(line, {
      sections: [...family.sections],
      parts: family.titles.join(' '),
      keywords: '',
    })
  return result
}
