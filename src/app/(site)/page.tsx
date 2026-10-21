import { permanentRedirect } from 'next/navigation'
import { BimBand } from '@/components/BimBand/BimBand'
import { CatalogHashRedirect } from '@/components/CatalogHashRedirect/CatalogHashRedirect'
import { CtaBanner } from '@/components/CtaBanner/CtaBanner'
import { DirectionCard } from '@/components/DirectionCard/DirectionCard'
import { Faq } from '@/components/Faq/Faq'
import { FaqHelp } from '@/components/FaqHelp/FaqHelp'
import { Col, Grid } from '@/components/Grid/Grid'
import { HiddenTitle } from '@/components/HiddenTitle/HiddenTitle'
import { HomeNews } from '@/components/HomeNews/HomeNews'
import { HomePopular } from '@/components/HomePopular/HomePopular'
import { ProcessSteps } from '@/components/ProcessSteps/ProcessSteps'
import { Reveal } from '@/components/Reveal/Reveal'
import { Section } from '@/components/Section/Section'
import { getDirections } from '@/lib/catalog'
import { fromParams, toQuery } from '@/lib/catalogFilter'
import { getHome } from '@/lib/home'
import { getMenuPopular } from '@/lib/menuPopular'
import { getContacts } from '@/lib/navigation'
import { CATALOG_PATH, catalogHref } from '@/lib/navigationHrefs'
import { getPublications, getTopicCovers } from '@/lib/publications'
import { directionExtras } from '@/lib/siteNav'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export const metadata = { alternates: { canonical: '/' } }

/**
 * Главная — шаблон «Витрина» (аудит 21.10.2026, пакет 1: на телефоне было 13,9 экрана):
 * первым блоком BIM в коротком виде (решение владельца 16.10 и 21.10.2026: BIM первым, но без
 * воды), направления (на телефоне по две плитки в ряд), «Популярные решения» вместо каталога
 * с фильтром (полный каталог — /catalog и меню; на главной он занимал 5 экранов и грузил в
 * браузер все товары), «Новости и акции», «Как мы работаем», вопросы, «Нашли дешевле».
 * h1 из админки «Главная» скрыт визуально. Подзаголовков-инструкций у секций нет.
 */
export default async function Home({ searchParams }: Props) {
  // Старые ссылки на каталог с условиями (/?direction=…#catalog) ведут на /catalog с теми же условиями.
  const query = toQuery(fromParams(await searchParams))
  if (query) permanentRedirect(`${CATALOG_PATH}?${query}`)

  const [home, directions, news, contacts, popular, topicCovers] = await Promise.all([
    getHome(),
    getDirections(),
    getPublications({ limit: 3 }),
    getContacts(),
    getMenuPopular(),
    getTopicCovers(),
  ])
  return (
    <main>
      <CatalogHashRedirect />
      {home.title && <HiddenTitle>{home.title}</HiddenTitle>}
      <BimBand
        bim={home.bim}
        more={{ href: '/bim', label: 'Подробнее о внедрении' }}
        priority
        compact
      />
      {/* Блок «Официальный партнёр» скрыт (замечание владельца 12.10.2026: меньше шума), данные
          остались в админке — вернуть: <TrustBand trust={home.trust} />. */}
      <Section
        id="directions"
        title="Выберите направление"
        action={{ href: catalogHref(), label: 'Весь каталог' }}
      >
        <Grid as="ul" span={{ base: 6, md: 3 }}>
          {[...directions, ...directionExtras].map((direction, i) => (
            <Reveal as="li" key={direction.slug} step={i % 4}>
              <DirectionCard direction={direction} />
            </Reveal>
          ))}
        </Grid>
      </Section>
      {popular.length > 0 && (
        <Section id="popular" title={home.popular.title}>
          <HomePopular cards={popular} />
        </Section>
      )}
      <HomeNews slides={home.slides} news={news.docs} covers={topicCovers} />
      {home.process.length > 0 && (
        <Section id="process" tone="tint" title="Как мы работаем">
          <Reveal>
            <ProcessSteps steps={home.process} cards={home.sideCards} />
          </Reveal>
        </Section>
      )}
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
