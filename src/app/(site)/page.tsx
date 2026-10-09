import { BimBand } from '@/components/BimBand/BimBand'
import { CatalogFilter } from '@/components/CatalogFilter/CatalogFilter'
import { CtaBanner } from '@/components/CtaBanner/CtaBanner'
import { DirectionCard } from '@/components/DirectionCard/DirectionCard'
import { Faq } from '@/components/Faq/Faq'
import { Col, Grid } from '@/components/Grid/Grid'
import { Hero } from '@/components/Hero/Hero'
import { NewsCard } from '@/components/NewsCard/NewsCard'
import { ProcessSteps } from '@/components/ProcessSteps/ProcessSteps'
import { Section } from '@/components/Section/Section'
import { getCatalog, getDirections } from '@/lib/catalog'
import { fromParams } from '@/lib/catalogFilter'
import { getHome } from '@/lib/home'
import { getPublications, toCard } from '@/lib/publications'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

const newsTones = ['navy', 'graphite', 'deep'] as const

/** Подборки фильтра (?group=…) — та же главная: канонический адрес один. */
export const metadata = { alternates: { canonical: '/' } }

/** Главная — шаблон «Витрина»: секции во всю рамку, внутри 12-колоночная сетка. */
export default async function Home({ searchParams }: Props) {
  const [home, directions, catalog, news, params] = await Promise.all([
    getHome(),
    getDirections(),
    getCatalog(),
    getPublications({ limit: 3 }),
    searchParams,
  ])
  const initial = fromParams(params)
  return (
    <main>
      <Hero home={home} />
      <BimBand bim={home.bim} />
      <Section
        id="directions"
        title="Выберите направление"
        sub="Разные задачи — разный софт. Карточка сразу открывает каталог с нужным набором вендоров и задач."
      >
        <Grid as="ul" span={{ base: 12, sm: 6, md: 4 }}>
          {directions.map((direction) => (
            <li key={direction.slug}>
              <DirectionCard direction={direction} />
            </li>
          ))}
        </Grid>
      </Section>
      <Section
        id="catalog"
        title="Подбор по каталогу"
        sub="Выберите направление, затем производителя и линейку программ."
      >
        <CatalogFilter
          key={JSON.stringify(initial)}
          items={catalog.items}
          facets={catalog.facets}
          lines={catalog.lines}
          initial={initial}
        />
      </Section>
      {home.process.length > 0 && (
        <Section
          id="process"
          tone="tint"
          title="Как мы работаем — и почему нам доверяют"
          sub="Прозрачный процесс от заявки до внедрения."
        >
          <ProcessSteps steps={home.process} />
        </Section>
      )}
      <Section
        id="news"
        title="Новости и обновления"
        action={{ href: '/news', label: 'Все новости' }}
      >
        <Grid as="ul" span={{ base: 12, sm: 6, md: 4 }}>
          {news.docs.map((item, i) => (
            <li key={item.id}>
              <NewsCard news={toCard(item)} tone={newsTones[i % newsTones.length]} />
            </li>
          ))}
        </Grid>
      </Section>
      {home.faq.length > 0 && (
        <Section id="faq" title="Частые вопросы">
          <Grid>
            <Col span={{ base: 12, md: 8 }}>
              <Faq items={home.faq} />
            </Col>
          </Grid>
        </Section>
      )}
      <CtaBanner cta={home.cta} />
    </main>
  )
}
