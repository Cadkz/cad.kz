import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { ProductView } from '@/components/ProductView/ProductView'
import { getProduct, productMetadata } from '@/lib/product'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct((await params).slug)
  return product ? productMetadata(product) : {}
}

/** Товар по новому адресу. Если товар был на старом сайте, ведём на прежний адрес. */
export default async function ProductPage({ params }: Props) {
  const product = await getProduct((await params).slug)
  if (!product) notFound()
  if (product.path !== `/products/${product.slug}`) permanentRedirect(product.path)
  return <ProductView product={product} />
}
