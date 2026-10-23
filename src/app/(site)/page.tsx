import { permanentRedirect } from 'next/navigation'
import { BimBand } from '@/components/BimBand/BimBand'
import { CatalogHashRedirect } from '@/components/CatalogHashRedirect/CatalogHashRedirect'
import { CtaBanner } from '@/components/CtaBanner/CtaBanner'
import { DirectionCard } from '@/components/DirectionCard/DirectionCard'
import { Faq } from '@/components/Faq/Faq'
import { FaqHelp } from '@/components/FaqHelp/FaqHelp'
import { Col, Grid } from '@/components/Grid/Grid'
import { HiddenTitle } from '@/components/HiddenTitle/HiddenTitle'
import { HomeCatalog } from '@/components/HomeCatalog/HomeCatalog'
import { HomeNews } from '@/components/HomeNews/HomeNews'
import { ProcessSteps } from '@/components/ProcessSteps/ProcessSteps'
import { Reveal } from '@/components/Reveal/Reveal'
import { Section } from '@/components/Section/Section'
import { getDirections } from '@/lib/catalog'
import { fromParams, toQuery } from '@/lib/catalogFilter'
import { getHome } from '@/lib/home'
import { getContacts } from '@/lib/navigation'
import { CATALOG_PATH, catalogHref } from '@/lib/navigationHrefs'
import { getPublications, getTopicCovers } from '@/lib/publications'
import { directionExtras } from '@/lib/siteNav'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export const metadata = { alternates: { canonical: '/' } }

/**
 * Главная — шаблон «Витрина». Первым блоком BIM целиком (решение владельца 16.10 и 21.10.2026,
 * без плашки над заголовком), направления (на телефоне по две плитки в ряд), каталог с фильтром —
 * только от 960 px (решение владельца 21.10.2026: на телефоне он занимал 5 экранов; полный
 * каталог там — в меню и на /catalog; в страницу каталог не кладётся, компьютер догружает его
 * сам — HomeCatalog, пакет 7 «Скорость»), «Новости и акции», «Как мы работаем», вопросы,
 * «Нашли дешевле». «Популярные решения» — в меню «Каталог», не на главной. h1 из админки
 * «Главная» скрыт визуально. Подзаголовков-инструкций у секций нет (аудит 21.10.2026).
 */
export default async function Home({ searchParams }: Props) {
  // Старые ссылки на каталог с условиями (/?direction=…#catalog) ведут на /catalog с теми же условиями.
  const query = toQuery(fromParams(await searchParams))
  if (query) permanentRedirect(`${CATALOG_PATH}?${query}`)

  const [home, directions, news, contacts, topicCovers] = await Promise.all([
    getHome(),
    getDirections(),
    getPublications({ limit: 3 }),
    getContacts(),
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
        noEyebrow
      />
      {/* Блок «Официальный партнёр» скрыт (замечание владельца 12.10.2026: меньше шума), данные
          остались в админке — вернуть: <TrustBand trust={home.trust} />. */}
      <Section
        id="directions"
        title="Выберите направление"
        action={{ href: catalogHref(), label: 'Весь каталог' }}
      >
        <Grid as="ul" span={{ base: 12, sm: 6, md: 3 }}>
          {[...directions, ...directionExtras].map((direction, i) => (
            <Reveal as="li" key={direction.slug} step={i % 4}>
              <DirectionCard direction={direction} />
            </Reveal>
          ))}
        </Grid>
      </Section>
      <Section
        id="home-catalog"
        title="Каталог"
        action={{ href: catalogHref(), label: 'Открыть каталог' }}
        desktopOnly
      >
        <HomeCatalog />
      </Section>
      <HomeNews slides={home.slides} news={news.docs} covers={topicCovers} />
      {home.process.length > 0 && (
        <Section id="process" tone="tint" title="Как мы работаем">
          <ProcessSteps steps={home.process} cards={home.sideCards} />
        </Section>
      )}
      {home.faq.length > 0 && (
        <Section id="faq" title="Частые вопросы" still>
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
