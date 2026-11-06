import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ProductView } from '@/components/ProductView/ProductView'
import { getT, langPermanentRedirect } from '@/i18n/server'
import { noPageTarget } from '@/lib/pageTarget'
import { cms } from '@/lib/payload'
import { getProduct, pickParam, productMetadata } from '@/lib/product'

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct((await params).slug)
  return product ? productMetadata(product, await getT()) : {}
}

/** Товар по новому адресу. Если товар был на старом сайте, ведём на прежний адрес. */
export default async function ProductPage({ params, searchParams }: Props) {
  const product = await getProduct((await params).slug)
  if (!product) notFound()
  if (product.pageView === 'none')
    return langPermanentRedirect(await noPageTarget(await cms(), product))
  if (product.path !== `/products/${product.slug}`) return langPermanentRedirect(product.path)
  return <ProductView product={product} pick={pickParam(await searchParams)} />
}
