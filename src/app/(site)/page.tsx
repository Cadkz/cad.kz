import { permanentRedirect } from 'next/navigation'
import { BimBand } from '@/components/BimBand/BimBand'
import { CatalogHashRedirect } from '@/components/CatalogHashRedirect/CatalogHashRedirect'
import { CtaBanner } from '@/components/CtaBanner/CtaBanner'
import { DirectionIndex } from '@/components/DirectionIndex/DirectionIndex'
import { Faq } from '@/components/Faq/Faq'
import { FaqHelp } from '@/components/FaqHelp/FaqHelp'
import { Col, Grid } from '@/components/Grid/Grid'
import { Hero } from '@/components/Hero/Hero'
import { NewsLine } from '@/components/NewsLine/NewsLine'
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

export const metadata = { alternates: { canonical: '/' } }

/**
 * Главная — шаблон «Витрина» (редизайн по аудиту 12.10.2026): у каждого блока свой вид подачи.
 * Первый экран (тёмный) → популярные решения строками-переходами → продление лицензий сразу под
 * ними → направления светлым указателем → акции (слайдер) → как мы работаем линией → BIM (тёмный)
 * → новости лентой → вопросы → «Нашли дешевле» (тёмный). Тёмных крупных блоков три, остальное
 * светлое; отступы между секциями разные (tight / normal / wide). Каталог — страница /catalog.
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
      <Reveal>
        <RenewBand title={home.renew.title} text={home.renew.text} />
      </Reveal>
      <Section
        id="directions"
        space="wide"
        title="Выберите направление"
        sub="Откроется каталог этого направления."
        action={popular.length ? undefined : { href: catalogHref(), label: 'Весь каталог' }}
      >
        <Reveal>
          <DirectionIndex items={[...directions, ...directionExtras]} />
        </Reveal>
      </Section>
      <Reveal>
        <PromoBand home={home} />
      </Reveal>
      {home.process.length > 0 && (
        <Section
          id="process"
          space="wide"
          title="Как мы работаем — и почему нам доверяют"
          sub="Прозрачный процесс от заявки до внедрения."
        >
          <Reveal>
            <ProcessSteps steps={home.process} />
          </Reveal>
        </Section>
      )}
      <Reveal>
        <BimBand bim={home.bim} />
      </Reveal>
      <Section
        id="news"
        space="wide"
        title="Новости и обновления"
        action={{ href: '/news', label: 'Все новости' }}
      >
        <Reveal>
          <NewsLine items={news.docs.map(toCard)} />
        </Reveal>
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
