import type { Metadata } from 'next'
import { ArticleBody } from '@/components/ArticleBody/ArticleBody'
import { AskManager } from '@/components/AskManager/AskManager'
import { BimBand } from '@/components/BimBand/BimBand'
import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs'
import { Container } from '@/components/Container/Container'
import { Grid } from '@/components/Grid/Grid'
import { ProductCard } from '@/components/ProductCard/ProductCard'
import { ReadingLayout } from '@/components/ReadingLayout/ReadingLayout'
import { Section } from '@/components/Section/Section'
import { getCatalog } from '@/lib/catalog'
import { getHome } from '@/lib/home'
import { getContacts } from '@/lib/navigation'
import { catalogHref } from '@/lib/navigationHrefs'
import { getPage } from '@/lib/pages'
import { cms } from '@/lib/payload'
import { bodyPictures } from '@/lib/pictures'
import { imageSources, parseBody } from '@/lib/richText'
import { pageMetadata } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage('bim')
  return pageMetadata({
    seo: page?.seo,
    title: 'Внедрение BIM — CAD.kz',
    description:
      page?.lead ??
      'Внедрение BIM в проектной организации: аудит, BIM-стандарт, координация моделей, архив и обучение.',
    path: '/bim',
  })
}

/** Сколько услуг и курсов показать под текстом. */
const SERVICES_LIMIT = 6

/**
 * «Внедрение BIM» (пункт меню, решение владельца 13.10.2026) — подробное объяснение баннера
 * с главной. Сверху тот же баннер (этапы и цифры из «Главной страницы» в админке), ниже текст
 * из «Страниц» (код bim) по шаблону «Чтение» и справа Кадди с вопросами; внизу услуги внедрения
 * и курсы по BIM из каталога.
 */
export default async function BimPage() {
  const [home, page, contacts, catalog] = await Promise.all([
    getHome(),
    getPage('bim'),
    getContacts(),
    getCatalog(),
  ])
  const blocks = parseBody(page?.body, page?.title)
  const pictures = await cms().then((payload) => bodyPictures(payload, imageSources(blocks)))
  const services = catalog.items
    .filter(
      (item) =>
        item.types.includes('consulting') ||
        (item.types.includes('training') && /bim|бим|revit|navisworks/i.test(item.title)),
    )
    .sort((a, b) => Number(b.types.includes('consulting')) - Number(a.types.includes('consulting')))
    .slice(0, SERVICES_LIMIT)
  return (
    <main>
      <Container>
        <Breadcrumbs items={[{ title: 'Главная', href: '/' }, { title: 'Внедрение BIM' }]} />
      </Container>
      <BimBand bim={home.bim} level={1} flush />
      {blocks.length > 0 && (
        <Section id="bim-details" title="Как это работает">
          <ReadingLayout
            aside={
              <AskManager
                contacts={contacts}
                layout="aside"
                title="Обсудим внедрение?"
                phrase="Расскажите, сколько у вас проектировщиков и какие разделы вы делаете, — подскажу, с чего начать."
                message="Здравствуйте! Хотим обсудить внедрение BIM."
              />
            }
          >
            <ArticleBody blocks={blocks} pictures={pictures} />
          </ReadingLayout>
        </Section>
      )}
      {services.length > 0 && (
        <Section
          id="bim-services"
          title="Услуги и курсы"
          action={{ href: catalogHref({ group: 'service' }), label: 'Все услуги и обучение' }}
        >
          <Grid as="ul" span={{ base: 12, sm: 6, md: 4 }}>
            {services.map((item) => (
              <li key={item.id}>
                <ProductCard product={item} />
              </li>
            ))}
          </Grid>
        </Section>
      )}
    </main>
  )
}
