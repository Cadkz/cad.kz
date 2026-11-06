import type { Metadata } from 'next'
import { BimBand } from '@/components/BimBand/BimBand'
import { BimProof } from '@/components/BimProof/BimProof'
import { BimServices } from '@/components/BimServices/BimServices'
import { BimSplit } from '@/components/BimSplit/BimSplit'
import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs'
import { Container } from '@/components/Container/Container'
import { CtaBanner } from '@/components/CtaBanner/CtaBanner'
import { Grid } from '@/components/Grid/Grid'
import { ProductCard } from '@/components/ProductCard/ProductCard'
import { Reveal } from '@/components/Reveal/Reveal'
import { Section } from '@/components/Section/Section'
import { getT } from '@/i18n/server'
import { getBimPage } from '@/lib/bimPage'
import { getCatalog } from '@/lib/catalog'
import { getHome } from '@/lib/home'
import { catalogHref } from '@/lib/navigationHrefs'
import { getPage } from '@/lib/pages'
import { pageMetadata } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  const [page, t] = await Promise.all([getPage('bim'), getT()])
  return pageMetadata({
    seo: page?.seo,
    title: t('BIM: процессы, инструменты и команда — CAD.kz'),
    description: t(
      'BIM-процессы, координация проектов, шаблоны Revit и обучение команды. Практика CAD.kz в Казахстане с 2015 года.',
    ),
    path: '/bim',
  })
}

/** Сколько услуг и курсов показать перед призывом. */
const SERVICES_LIMIT = 6

/**
 * Страница BIM (пункт меню «BIM», макет владельца 06.11.2026): сверху баннер из «Главной сайта»,
 * под ним тексты из «Страница BIM» — опыт, зачем BIM, как мы помогаем, задачи, результат; затем
 * услуги и курсы по BIM из каталога и баннер «С какой задачи начнём?».
 */
export default async function BimPage() {
  const [home, bim, catalog, t] = await Promise.all([getHome(), getBimPage(), getCatalog(), getT()])
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
        <Breadcrumbs items={[{ title: 'Главная', href: '/' }, { title: 'BIM' }]} />
      </Container>
      <BimBand bim={home.bim} level={1} flush compact noEyebrow />
      <BimProof items={bim.proof} label={t('Опыт CAD.kz')} />
      <BimSplit block={bim.intro} id="bim-intro" />
      <BimSplit block={bim.help} id="bim-help" tone="card" />
      {bim.services.length > 0 && (
        <Section id="bim-tasks" title={bim.servicesTitle ?? t('Какие задачи можем решить')}>
          <BimServices items={bim.services} />
        </Section>
      )}
      <BimSplit block={bim.outcome} id="bim-outcome" />
      {services.length > 0 && (
        <Section
          id="bim-services"
          title={t('Услуги и курсы')}
          action={{ href: catalogHref({ group: 'service' }), label: t('Все услуги и обучение') }}
        >
          <Grid as="ul" span={{ base: 12, sm: 6, md: 4 }}>
            {services.map((item, index) => (
              <Reveal as="li" key={item.id} step={index % 3}>
                <ProductCard product={item} />
              </Reveal>
            ))}
          </Grid>
        </Section>
      )}
      <CtaBanner
        art="layers"
        cta={{ title: bim.cta.title, text: bim.cta.text.join(' ') || null, link: bim.cta.link }}
      />
    </main>
  )
}
