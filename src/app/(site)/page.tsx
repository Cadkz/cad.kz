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
import { ProcessSteps } from '@/components/ProcessSteps/ProcessSteps'
import { Reveal } from '@/components/Reveal/Reveal'
import { Section } from '@/components/Section/Section'
import { getCatalog, getDirections } from '@/lib/catalog'
import { emptyFilter, fromParams, toQuery } from '@/lib/catalogFilter'
import { getHome } from '@/lib/home'
import { getContacts } from '@/lib/navigation'
import { CATALOG_PATH, catalogHref } from '@/lib/navigationHrefs'
import { getPublications, getTopicCovers } from '@/lib/publications'
import { directionExtras } from '@/lib/siteNav'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export const metadata = { alternates: { canonical: '/' } }

/**
 * Главная — шаблон «Витрина»: первый экран «Подбор по задаче» с Кадди (16.10.2026; блок партнёров скрыт; «Популярные
 * решения» переехали в меню «Каталог» первой вкладкой — решение владельца 16.10.2026), направления и под ними каталог с фильтром (полный каталог — /catalog),
 * BIM сразу после каталога, как мы работаем (с карточками «ТЗ» и «госзакупки»), «Новости и
 * акции» (слайдер акций + две новости), вопросы. Продление лицензий — только в меню.
 * Порядок и состав — по замечаниям владельца 13.10.2026, вечер.
 */
export default async function Home({ searchParams }: Props) {
  // Старые ссылки на каталог с условиями (/?direction=…#catalog) ведут на /catalog с теми же условиями.
  const query = toQuery(fromParams(await searchParams))
  if (query) permanentRedirect(`${CATALOG_PATH}?${query}`)

  const [home, directions, news, contacts, catalog, topicCovers] = await Promise.all([
    getHome(),
    getDirections(),
    getPublications({ limit: 3 }),
    getContacts(),
    getCatalog(),
    getTopicCovers(),
  ])
  return (
    <main>
      <CatalogHashRedirect />
      <Hero home={home} />
      {/* Блок «Официальный партнёр» скрыт (замечание владельца 12.10.2026: меньше шума), данные
          остались в админке — вернуть: <TrustBand trust={home.trust} />. */}
      <Section
        id="directions"
        title="Выберите направление"
        sub="Карточка открывает каталог этого направления."
        action={{ href: catalogHref(), label: 'Весь каталог' }}
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
      <HomeNews slides={home.slides} news={news.docs} covers={topicCovers} />
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
