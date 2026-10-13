import { permanentRedirect } from 'next/navigation'
import { BimBand } from '@/components/BimBand/BimBand'
import { CatalogFilter } from '@/components/CatalogFilter/CatalogFilter'
import { CatalogHashRedirect } from '@/components/CatalogHashRedirect/CatalogHashRedirect'
import { CtaBanner } from '@/components/CtaBanner/CtaBanner'
import { DirectionCard } from '@/components/DirectionCard/DirectionCard'
import { Faq } from '@/components/Faq/Faq'
import { FaqHelp } from '@/components/FaqHelp/FaqHelp'
import { Col, Grid } from '@/components/Grid/Grid'
import { Hero } from '@/components/Hero/Hero'
import { HomeNews } from '@/components/HomeNews/HomeNews'
import { PopularCard } from '@/components/PopularCard/PopularCard'
import { ProcessSteps } from '@/components/ProcessSteps/ProcessSteps'
import { PromoBand } from '@/components/PromoBand/PromoBand'
import { Reveal } from '@/components/Reveal/Reveal'
import { Section } from '@/components/Section/Section'
import { getCatalog, getDirections } from '@/lib/catalog'
import { emptyFilter, fromParams, toQuery } from '@/lib/catalogFilter'
import { getHome } from '@/lib/home'
import { getContacts } from '@/lib/navigation'
import { CATALOG_PATH, catalogHref } from '@/lib/navigationHrefs'
import { popularCards } from '@/lib/popular'
import { getPublications, getTopicCovers } from '@/lib/publications'
import { directionExtras } from '@/lib/siteNav'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export const metadata = { alternates: { canonical: '/' } }

/**
 * Главная — шаблон «Витрина»: первый экран с тремя действиями, популярные решения плитками
 * (блок партнёров скрыт), направления и под ними каталог с фильтром (вернули 13.10.2026; полный
 * каталог — /catalog), действующие акции, BIM, как мы работаем (с карточками «ТЗ» и
 * «госзакупки»), статьи и новости, вопросы. Продление лицензий — только в меню (13.10.2026).
 */
export default async function Home({ searchParams }: Props) {
  // Старые ссылки на каталог с условиями (/?direction=…#catalog) ведут на /catalog с теми же условиями.
  const query = toQuery(fromParams(await searchParams))
  if (query) permanentRedirect(`${CATALOG_PATH}?${query}`)

  const [home, directions, articles, news, contacts, catalog, topicCovers] = await Promise.all([
    getHome(),
    getDirections(),
    getPublications({ kinds: ['article'], limit: 1 }),
    getPublications({ limit: 3 }),
    getContacts(),
    getCatalog(),
    getTopicCovers(),
  ])
  const popular = popularCards(home.popular.items, catalog.items)
  return (
    <main>
      <CatalogHashRedirect />
      <Hero home={home} directions={directions} />
      {/* Блок «Официальный партнёр» скрыт (замечание владельца 12.10.2026: меньше шума), данные
          остались в админке — вернуть: <TrustBand trust={home.trust} />. */}
      {popular.length > 0 && (
        <Section
          id="popular"
          title={home.popular.title}
          sub={home.popular.lead ?? undefined}
          action={{ href: catalogHref(), label: 'Весь каталог' }}
        >
          <Grid as="ul" span={{ base: 6, sm: 3 }}>
            {popular.map((card) => (
              <li key={card.key}>
                <PopularCard card={card} />
              </li>
            ))}
          </Grid>
        </Section>
      )}
      <Section
        id="directions"
        title="Выберите направление"
        sub="Карточка открывает каталог этого направления."
        action={popular.length ? undefined : { href: catalogHref(), label: 'Весь каталог' }}
      >
        <Grid as="ul" span={{ base: 12, sm: 6, md: 3 }}>
          {[...directions, ...directionExtras].map((direction, i) => (
            <Reveal as="li" key={direction.slug} step={i}>
              <DirectionCard direction={direction} />
            </Reveal>
          ))}
        </Grid>
      </Section>
      <Section
        id="home-catalog"
        title="Каталог"
        sub="Выберите раздел и производителя — товары появятся сразу."
        action={{ href: catalogHref(), label: 'Открыть каталог' }}
      >
        <CatalogFilter
          items={[...catalog.items, ...catalog.extras]}
          facets={catalog.facets}
          lines={catalog.lines}
          initial={emptyFilter}
        />
      </Section>
      <Reveal>
        <PromoBand home={home} />
      </Reveal>
      <Reveal>
        <BimBand bim={home.bim} more={{ href: '/bim', label: 'Подробнее о внедрении' }} />
      </Reveal>
      {home.process.length > 0 && (
        <Section
          id="process"
          tone="tint"
          title="Как мы работаем — и почему нам доверяют"
          sub="Прозрачный процесс от заявки до внедрения."
        >
          <Reveal>
            <ProcessSteps steps={home.process} cards={home.sideCards} />
          </Reveal>
        </Section>
      )}
      <HomeNews feature={articles.docs[0] ?? null} news={news.docs} covers={topicCovers} />
      {home.faq.length > 0 && (
        <Section id="faq" title="Частые вопросы">
          <Grid>
            <Col span={{ base: 12, md: 8 }}>
              <Faq items={home.faq} />
            </Col>
            <Col span={{ base: 12, md: 4 }}>
              <FaqHelp contacts={contacts} />
            </Col>
          </Grid>
        </Section>
      )}
      <Reveal>
        <CtaBanner cta={home.cta} />
      </Reveal>
    </main>
  )
}
