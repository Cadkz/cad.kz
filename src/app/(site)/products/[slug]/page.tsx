import { notFound } from 'next/navigation'
import { demoProducts } from '@/domain/demo'
import { Configurator } from '@/components/Catalog'
export default async function Product({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const product = demoProducts.find(p => p.id === slug); if (!product) notFound(); return <main><section><p className="eyebrow">{product.direction} / {product.manufacturer}</p><h1>{product.title}</h1><p>{product.description}</p><Configurator product={product}/></section></main> }
