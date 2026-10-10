import { permanentRedirect } from 'next/navigation'
import { BimBand } from '@/components/BimBand/BimBand'
import { CatalogHashRedirect } from '@/components/CatalogHashRedirect/CatalogHashRedirect'
import { CtaBanner } from '@/components/CtaBanner/CtaBanner'
import { DirectionCard } from '@/components/DirectionCard/DirectionCard'
import { Faq } from '@/components/Faq/Faq'
import { FaqHelp } from '@/components/FaqHelp/FaqHelp'
import { Col, Grid } from '@/components/Grid/Grid'
import { Hero } from '@/components/Hero/Hero'
import { NewsDigest } from '@/components/NewsDigest/NewsDigest'
import { ProcessSteps } from '@/components/ProcessSteps/ProcessSteps'
import { PromoBand } from '@/components/PromoBand/PromoBand'
import { Reveal } from '@/components/Reveal/Reveal'
import { Section } from '@/components/Section/Section'
import { TrustBand } from '@/components/TrustBand/TrustBand'
import { getDirections } from '@/lib/catalog'
import { fromParams, toQuery } from '@/lib/catalogFilter'
import { getHome } from '@/lib/home'
import { getContacts } from '@/lib/navigation'
import { CATALOG_PATH, catalogHref } from '@/lib/navigationHrefs'
import { getPublications, toCard } from '@/lib/publications'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export const metadata = { alternates: { canonical: '/' } }

/**
 * Главная — шаблон «Витрина»: первый экран с тремя действиями, официальные партнёрства,
 * направления, акции, BIM,
 * как мы работаем, новости, вопросы. Каталог — отдельная страница /catalog.
 */
export default async function Home({ searchParams }: Props) {
  // Старые ссылки на каталог с условиями (/?direction=…#catalog) ведут на /catalog с теми же условиями.
  const query = toQuery(fromParams(await searchParams))
  if (query) permanentRedirect(`${CATALOG_PATH}?${query}`)

  const [home, directions, news, contacts] = await Promise.all([
    getHome(),
    getDirections(),
    getPublications({ limit: 3 }),
    getContacts(),
  ])
  return (
    <main>
      <CatalogHashRedirect />
      <Hero home={home} directions={directions} />
      <TrustBand trust={home.trust} />
      <Section
        id="directions"
        tone="tint"
        title="Выберите направление"
        sub="Карточка открывает каталог с программами этого направления."
        action={{ href: catalogHref(), label: 'Весь каталог' }}
      >
        <Grid as="ul" span={{ base: 12, sm: 6, md: 4 }}>
          {directions.map((direction, i) => (
            <Reveal as="li" key={direction.slug} step={i}>
              <DirectionCard direction={direction} />
            </Reveal>
          ))}
        </Grid>
      </Section>
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
      <Reveal>
        <CtaBanner cta={home.cta} />
      </Reveal>
      <Section
        id="news"
        title="Новости и обновления"
        action={{ href: '/news', label: 'Все новости' }}
      >
        <NewsDigest items={news.docs.map(toCard)} />
      </Section>
      {home.faq.length > 0 && (
        <Section id="faq" tone="tint" title="Частые вопросы">
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
    </main>
  )
}
