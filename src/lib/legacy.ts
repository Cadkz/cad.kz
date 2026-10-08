import type { Payload, Where } from 'payload'
import {
  cleanPath,
  kindGroup,
  manufacturerName,
  parseCatalogPath,
  sectionHint,
  staticLegacyTarget,
  storedVariants,
} from '../domain/legacyRoutes.mjs'
import { catalogHref, newsHref } from './navigationHrefs'
import { cms } from './payload'
import { legacySections, productPath } from './productPath'

/** Решение для старого адреса: показать товар прямо здесь или постоянно перенаправить. */
export type LegacyResolution = { render: string } | { redirect: string } | null

/** Перенаправление, заведённое вручную в админке («Система» → «Перенаправления»). */
async function manualRedirect(payload: Payload, path: string) {
  const { docs } = await payload.find({
    collection: 'redirects',
    where: { from: { in: storedVariants(path) } },
    limit: 1,
    depth: 0,
  })
  return docs[0]?.to ?? null
}

/** Опубликованная запись, у которой в поле «Прежний адрес» стоит этот адрес. */
async function byLegacyUrl(payload: Payload, path: string) {
  const where: Where = {
    and: [{ status: { equals: 'published' } }, { legacyUrl: { in: storedVariants(path) } }],
  }
  const [publications, sections] = await Promise.all([
    payload.find({ collection: 'publications', where, limit: 1, depth: 0 }),
    payload.find({ collection: 'sections', where, limit: 1, depth: 0 }),
  ])
  const publication = publications.docs[0]
  if (publication) return newsHref(publication.slug)
  const section = sections.docs[0]
  if (!section) return null
  return section.isDirection
    ? catalogHref({ direction: section.slug })
    : catalogHref({ group: section.menuGroup, type: section.slug })
}

/** Подсказка для раздела, проверенная по базе: фильтр каталога, который не окажется пустым. */
async function hintTarget(payload: Payload, section: string | null) {
  const hint: { group?: string; vendor?: string; direction?: string } = sectionHint(section)
  const published: Where = { status: { equals: 'published' } }
  if (hint.vendor) {
    const vendors = await payload.find({
      collection: 'manufacturers',
      where: { title: { equals: hint.vendor } },
      limit: 1,
      depth: 0,
    })
    const vendor = vendors.docs[0]
    const products = vendor
      ? await payload.count({
          collection: 'products',
          where: { and: [published, { manufacturer: { equals: vendor.id } }] },
        })
      : { totalDocs: 0 }
    if (products.totalDocs > 0) return catalogHref({ vendor: hint.vendor })
  }
  if (hint.direction) {
    const sections = await payload.find({
      collection: 'sections',
      where: { and: [published, { slug: { equals: hint.direction } }] },
      limit: 1,
      depth: 0,
    })
    const direction = sections.docs[0]
    const products = direction
      ? await payload.count({
          collection: 'products',
          where: { and: [published, { sections: { in: [direction.id] } }] },
        })
      : { totalDocs: 0 }
    if (products.totalDocs > 0) return catalogHref({ direction: hint.direction })
  }
  return hint.group ? catalogHref({ group: hint.group }) : null
}

/** Старый раздел каталога: его товары на новом сайте, их производитель или вкладка каталога. */
async function sectionTarget(payload: Payload, section: string | null) {
  const codes = Object.entries(legacySections)
    .filter(([, value]) => value === section)
    .map(([code]) => code)
  const { docs } = codes.length
    ? await payload.find({
        collection: 'products',
        where: { and: [{ status: { equals: 'published' } }, { slug: { in: codes } }] },
        limit: 200,
        depth: 1,
        select: { slug: true, legacyUrl: true, kind: true, manufacturer: true },
      })
    : { docs: [] }
  if (docs.length === 1) return productPath(docs[0])
  const vendors = new Set(
    docs.map((doc) =>
      doc.manufacturer && typeof doc.manufacturer !== 'number' ? doc.manufacturer.title : '',
    ),
  )
  const [vendor] = [...vendors]
  if (docs.length > 1 && vendors.size === 1 && vendor) return catalogHref({ vendor })
  const hinted = await hintTarget(payload, section)
  if (hinted) return hinted
  const groups = new Set(docs.map((doc) => kindGroup[doc.kind]))
  const [group] = [...groups]
  return catalogHref(docs.length > 1 && groups.size === 1 && group ? { group } : {})
}

/** Старый адрес товара или раздела каталога. */
async function catalogTarget(payload: Payload, path: string): Promise<LegacyResolution> {
  const parsed = parseCatalogPath(path)
  if (!parsed) return null
  if (parsed.code) {
    const { docs } = await payload.find({
      collection: 'products',
      where: {
        and: [
          { status: { equals: 'published' } },
          {
            or: [{ slug: { equals: parsed.code } }, { legacyUrl: { in: storedVariants(path) } }],
          },
        ],
      },
      limit: 2,
      depth: 0,
      select: { slug: true, legacyUrl: true },
    })
    const product = docs.find((doc) => doc.slug === parsed.code) ?? docs[0]
    if (product) {
      const canonical = productPath(product)
      return canonical === path ? { render: product.slug } : { redirect: canonical }
    }
  }
  return { redirect: await sectionTarget(payload, parsed.section) }
}

/** Производитель со старой страницы /about/manufacturer/<имя>/ — фильтр каталога по нему. */
async function manufacturerTarget(payload: Payload, path: string) {
  const name = manufacturerName(path)
  if (!name) return null
  const { docs } = await payload.find({
    collection: 'manufacturers',
    where: { title: { like: name } },
    limit: 1,
    depth: 0,
  })
  return docs[0] ? catalogHref({ vendor: docs[0].title }) : null
}

/**
 * Что делать со старым адресом. Порядок: ручное перенаправление из админки → запись
 * с этим «Прежним адресом» → товар или раздел каталога → общие правила. null — 404.
 */
export async function resolveLegacy(rawPath: string): Promise<LegacyResolution> {
  const path = cleanPath(rawPath)
  const payload = await cms()
  const manual = await manualRedirect(payload, path)
  if (manual) return { redirect: manual }
  const recorded = await byLegacyUrl(payload, path)
  if (recorded) return { redirect: recorded }
  const catalog = await catalogTarget(payload, path)
  if (catalog) return catalog
  const vendor = await manufacturerTarget(payload, path)
  if (vendor) return { redirect: vendor }
  const target = staticLegacyTarget(path)
  if (!target) return null
  return { redirect: 'to' in target ? target.to : catalogHref(target.catalog) }
}
