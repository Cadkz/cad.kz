import { notFound } from 'next/navigation'
import { Configurator } from '@/components/Configurator/Configurator'
import { Container } from '@/components/Container/Container'
import { getProduct } from '@/lib/product'

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) notFound()
  return (
    <main>
      <Container>
        <h1>{product.title}</h1>
        {product.summary && <p>{product.summary}</p>}
        <Configurator offers={product.offers} productTitle={product.title} />
      </Container>
    </main>
  )
}
