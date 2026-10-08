import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound, permanentRedirect } from 'next/navigation'
import { cache } from 'react'
import { ProductView } from '@/components/ProductView/ProductView'
import { LEGACY_PATH_HEADER } from '@/domain/legacyRoutes.mjs'
import { resolveLegacy } from '@/lib/legacy'
import { getProduct, productMetadata } from '@/lib/product'

type Props = { params: Promise<{ path: string[] }> }

/** Адрес запроса как есть, со слешем в конце, если он был (его передаёт src/proxy.ts). */
async function requestPath(params: Props['params']) {
  const original = (await headers()).get(LEGACY_PATH_HEADER)
  return original ?? `/${(await params).path.join('/')}`
}

const resolve = cache(async (path: string) => {
  const resolution = await resolveLegacy(path)
  if (resolution && 'render' in resolution) {
    const product = await getProduct(resolution.render)
    return product ? { product } : null
  }
  return resolution
})

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolution = await resolve(await requestPath(params))
  return resolution && 'product' in resolution ? productMetadata(resolution.product) : {}
}

/**
 * Старые адреса cad.kz. Товар, который был на старом сайте, открывается по прежнему адресу;
 * остальные старые адреса постоянно перенаправляются (308) на ближайшую страницу нового сайта.
 */
export default async function LegacyPage({ params }: Props) {
  const resolution = await resolve(await requestPath(params))
  if (!resolution) notFound()
  if ('redirect' in resolution) permanentRedirect(resolution.redirect)
  return <ProductView product={resolution.product} />
}
