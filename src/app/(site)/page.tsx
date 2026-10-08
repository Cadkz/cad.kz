import { Grid } from '@/components/Grid/Grid'
import { NewsCard } from '@/components/NewsCard/NewsCard'
import { ProductCard } from '@/components/ProductCard/ProductCard'
import { Section } from '@/components/Section/Section'
import { getCatalog } from '@/lib/catalog'
import { getPublications, toCard } from '@/lib/publications'

export default async function Home() {
  const [{ items }, news] = await Promise.all([getCatalog(), getPublications({ limit: 3 })])
  return (
    <main>
      <Section id="catalog" title="Каталог" sub="Товары и цены из CMS.">
        <Grid span={{ base: 12, sm: 6, md: 4 }}>
          {items.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </Grid>
      </Section>
      <Section title="Новости и обновления" action={{ href: '/news', label: 'Все новости' }}>
        <Grid span={{ base: 12, sm: 6, md: 4 }}>
          {news.docs.map((item) => (
            <NewsCard key={item.id} news={toCard(item)} />
          ))}
        </Grid>
      </Section>
    </main>
  )
}
