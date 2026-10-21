import { permanentRedirect } from 'next/navigation'
import { BimBand } from '@/components/BimBand/BimBand'
import { CatalogFilter } from '@/components/CatalogFilter/CatalogFilter'
import { CatalogHashRedirect } from '@/components/CatalogHashRedirect/CatalogHashRedirect'
import { CtaBanner } from '@/components/CtaBanner/CtaBanner'
import { DirectionCard } from '@/components/DirectionCard/DirectionCard'
import { Faq } from '@/components/Faq/Faq'
import { FaqHelp } from '@/components/FaqHelp/FaqHelp'
import { Col, Grid } from '@/components/Grid/Grid'
import { HiddenTitle } from '@/components/HiddenTitle/HiddenTitle'
import { HomeNews } from '@/components/HomeNews/HomeNews'
import { Isolines } from '@/components/Isolines/Isolines'
import { ProcessSteps } from '@/components/ProcessSteps/ProcessSteps'
import { Reveal } from '@/components/Reveal/Reveal'
import { Section } from '@/components/Section/Section'
import { ToneBackdrop } from '@/components/ToneBackdrop/ToneBackdrop'
import { ToneBand } from '@/components/ToneBand/ToneBand'
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
 * Пробный редизайн 21.10.2026 (ветка redesign/home-motion): тёмные и светлые блоки чередуются
 * (ToneBand), подложка страницы плавно меняет оттенок по блоку в середине экрана (ToneBackdrop),
 * в первом экране — медленные изолинии (Isolines).
 *
 * Главная — шаблон «Витрина»: первым блоком BIM (решение владельца 16.10.2026, вечер: первый баннер
 * «Подбор по задаче» убран, компонент Hero оставлен для возврата; h1 из админки «Главная» скрыт
 * визуально), затем направления и каталог с фильтром (полный каталог — /catalog; блок партнёров
 * скрыт; «Популярные решения» — в меню «Каталог»), как мы работаем (с карточками «ТЗ» и «госзакупки»), «Новости и
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
      <ToneBackdrop initial="mist" />
      {home.title && <HiddenTitle>{home.title}</HiddenTitle>}
      <ToneBand tone="night" first decor={<Isolines />}>
        <BimBand
          bim={home.bim}
          more={{ href: '/bim', label: 'Подробнее о внедрении' }}
          priority
          bare
        />
      </ToneBand>
      {/* Блок «Официальный партнёр» скрыт (замечание владельца 12.10.2026: меньше шума), данные
          остались в админке — вернуть: <TrustBand trust={home.trust} />. */}
      <ToneBand tone="mist">
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
      </ToneBand>
      <ToneBand tone="base">
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
      </ToneBand>
      {home.process.length > 0 && (
        <ToneBand tone="night">
          <Section
            id="process"
            tone="night"
            title="Как мы работаем — и почему нам доверяют"
            sub="Прозрачный процесс от заявки до внедрения."
          >
            <Reveal>
              <ProcessSteps steps={home.process} cards={home.sideCards} />
            </Reveal>
          </Section>
        </ToneBand>
      )}
      <ToneBand tone="lilac">
        <HomeNews slides={home.slides} news={news.docs} covers={topicCovers} />
      </ToneBand>
      {home.faq.length > 0 && (
        <ToneBand tone="sky">
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
        </ToneBand>
      )}
      <ToneBand tone="base">
        <Reveal>
          <CtaBanner cta={home.cta} />
        </Reveal>
      </ToneBand>
    </main>
  )
}
