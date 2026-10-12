import { permanentRedirect } from 'next/navigation'
import { BimBand } from '@/components/BimBand/BimBand'
import { CatalogHashRedirect } from '@/components/CatalogHashRedirect/CatalogHashRedirect'
import { CtaBanner } from '@/components/CtaBanner/CtaBanner'
import { DirectionCard } from '@/components/DirectionCard/DirectionCard'
import { Faq } from '@/components/Faq/Faq'
import { FaqHelp } from '@/components/FaqHelp/FaqHelp'
import { Col, Grid } from '@/components/Grid/Grid'
import { Hero } from '@/components/Hero/Hero'
import { NewsCard } from '@/components/NewsCard/NewsCard'
import { PopularCard } from '@/components/PopularCard/PopularCard'
import { ProcessSteps } from '@/components/ProcessSteps/ProcessSteps'
import { PromoBand } from '@/components/PromoBand/PromoBand'
import { RenewBand } from '@/components/RenewBand/RenewBand'
import { Reveal } from '@/components/Reveal/Reveal'
import { Section } from '@/components/Section/Section'
import { getCatalog, getDirections } from '@/lib/catalog'
import { fromParams, toQuery } from '@/lib/catalogFilter'
import { getHome } from '@/lib/home'
import { getContacts } from '@/lib/navigation'
import { CATALOG_PATH, catalogHref } from '@/lib/navigationHrefs'
import { popularCards } from '@/lib/popular'
import { getPublications, toCard } from '@/lib/publications'
import { directionExtras } from '@/lib/siteNav'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

const newsTones = ['navy', 'graphite', 'deep'] as const

export const metadata = { alternates: { canonical: '/' } }

/**
 * Главная — шаблон «Витрина» (порядок по документу о каталоге по CRM, 12.10.2026): первый экран
 * с тремя действиями, популярные решения плитками (блок партнёров скрыт), направления, продление
 * лицензий, акции, BIM, как мы работаем, новости, вопросы. Каталог — отдельная страница /catalog.
 */
export default async function Home({ searchParams }: Props) {
  // Старые ссылки на каталог с условиями (/?direction=…#catalog) ведут на /catalog с теми же условиями.
  const query = toQuery(fromParams(await searchParams))
  if (query) permanentRedirect(`${CATALOG_PATH}?${query}`)

  const [home, directions, news, contacts, catalog] = await Promise.all([
    getHome(),
    getDirections(),
    getPublications({ limit: 3 }),
    getContacts(),
    getCatalog(),
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
      <Reveal>
        <RenewBand title={home.renew.title} text={home.renew.text} />
      </Reveal>
      <Reveal>
        <PromoBand home={home} />
      </Reveal>
      <Reveal>
        <BimBand bim={home.bim} />
      </Reveal>
      {home.process.length > 0 && (
        <Section
          id="process"
          tone="tint"
          title="Как мы работаем — и почему нам доверяют"
          sub="Прозрачный процесс от заявки до внедрения."
        >
          <Reveal>
            <ProcessSteps steps={home.process} />
          </Reveal>
        </Section>
      )}
      <Section
        id="news"
        title="Новости и обновления"
        action={{ href: '/news', label: 'Все новости' }}
      >
        <Grid as="ul" span={{ base: 12, sm: 6, md: 4 }}>
          {news.docs.map((item, i) => (
            <Reveal as="li" key={item.id} step={i}>
              <NewsCard news={toCard(item)} tone={newsTones[i % newsTones.length]} />
            </Reveal>
          ))}
        </Grid>
      </Section>
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
