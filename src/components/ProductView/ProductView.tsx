import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs'
import { CollectionContents } from '@/components/CollectionContents/CollectionContents'
import { Container } from '@/components/Container/Container'
import { Faq } from '@/components/Faq/Faq'
import { JsonLd } from '@/components/JsonLd/JsonLd'
import { PickerBar } from '@/components/PickerBar/PickerBar'
import { PickerHelp } from '@/components/PickerHelp/PickerHelp'
import { PickerProvider } from '@/components/PickerProvider/PickerProvider'
import { PickerSteps } from '@/components/PickerSteps/PickerSteps'
import { PickerSummary } from '@/components/PickerSummary/PickerSummary'
import { ProductAbout } from '@/components/ProductAbout/ProductAbout'
import { ProductFacts } from '@/components/ProductFacts/ProductFacts'
import { ProductHeader } from '@/components/ProductHeader/ProductHeader'
import { ProductLayout } from '@/components/ProductLayout/ProductLayout'
import { ProductLifecycle } from '@/components/ProductLifecycle/ProductLifecycle'
import { ProductPicks } from '@/components/ProductPicks/ProductPicks'
import { ProductScans } from '@/components/ProductScans/ProductScans'
import { ProductSection } from '@/components/ProductSection/ProductSection'
import { ProductStage } from '@/components/ProductStage/ProductStage'
import { ProductTabs } from '@/components/ProductTabs/ProductTabs'
import { PropertyList } from '@/components/PropertyList/PropertyList'
import { Reveal } from '@/components/Reveal/Reveal'
import { SectionIcon } from '@/components/SectionIcon/SectionIcon'
import { kindProfile } from '@/domain/productKind.mjs'
import { productLd } from '@/domain/structuredData.mjs'
import { getCatalog } from '@/lib/catalog'
import { getContacts } from '@/lib/navigation'
import { catalogHref } from '@/lib/navigationHrefs'
import { cms } from '@/lib/payload'
import type { PickTarget, ProductPage, RelatedProduct } from '@/lib/product'
import { getRecommendations } from '@/lib/recommendations'
import { parseBody } from '@/lib/richText'
import { shortDescription, siteUrl } from '@/lib/seo'
import type { PickItem } from '../PickRow/PickRow'

const groupLabels = {
  software: 'Программное обеспечение',
  hardware: 'Оборудование',
  course: 'Обучение',
  service: 'Услуги',
}
const groupKeys = {
  software: 'software',
  hardware: 'hardware',
  course: 'service',
  service: 'service',
}

/** Строки подборки с картинкой, ценой и корзиной — из того же набора, что каталог. */
function toPicks(items: RelatedProduct[], byHref: Map<string, PickItem>): PickItem[] {
  return items.map(
    (item) =>
      byHref.get(item.href) ?? {
        ...item,
        picture: null,
        priceFrom: null,
        offersCount: 0,
        cartOfferId: null,
      },
  )
}

/**
 * Страница товара — шаблон «Товар», один для всех товаров; подписи блоков и главное действие
 * зависят от типа (src/domain/productKind.mjs). Первый экран: название, коротко, задачи;
 * справа итог выбора с действиями. Ниже фото, описание и характеристики, у сканеров — примеры
 * сканов во всю ширину, затем подбор по шагам (у обычной страницы — один шаг) и вопросы.
 */
export async function ProductView({
  product,
  pick,
}: {
  product: ProductPage
  pick: PickTarget | null
}) {
  const [{ cross, similar }, contacts, catalog] = await Promise.all([
    cms().then((payload) => getRecommendations(payload, product.id)),
    getContacts(),
    getCatalog(),
  ])
  const byHref = new Map<string, PickItem>(catalog.items.map((item) => [item.href, item]))
  const direction = product.sections.find((s) => s.isDirection)
  const guided = product.pageView === 'picker'
  const profile = kindProfile(product.kind)
  const about = product.description ? (
    <ProductAbout blocks={parseBody(product.description)} />
  ) : null
  const specs = product.properties.length > 0 ? <PropertyList items={product.properties} /> : null
  // Цена для поисковиков — та же «от», что в каталоге и в итоге подбора на этой странице.
  const listed = byHref.get(product.path)
  const structured = productLd({
    base: siteUrl(),
    path: product.path,
    title: product.title,
    description: shortDescription(product.summary || product.description, 300),
    images: product.pictures.map((picture) => picture.url),
    vendor: product.vendor,
    category: direction?.title ?? product.sections[0]?.title,
    priceFrom: listed?.priceFrom ?? null,
    offersCount: listed?.offersCount ?? 0,
  })
  const meta = {
    productId: product.id,
    kind: product.kind,
    productTitle: product.title,
    renewLabel: product.renewLabel,
    scenario: product.scenario,
    demo: product.demo,
    picks: cross.length > 0,
    about: Boolean(product.description),
    contacts: {
      phones: contacts.phones,
      whatsappHref: contacts.whatsappHref,
      email: contacts.email,
    },
  }

  const header = (
    <ProductHeader
      title={product.title}
      vendor={product.vendor}
      summary={product.summary}
      icon={null}
      tasks={product.tasks}
      requires={product.requires.map((r) => r.title)}
      media={
        // У курсов картинок нет (замечание владельца 27.10.2026): вместо сцены — факты строкой.
        product.kind === 'course' ? (
          <ProductFacts facts={product.facts} />
        ) : (
          <ProductStage
            title={product.title}
            pictures={product.stagePictures}
            facts={product.facts}
            placeholder={
              <span>
                <SectionIcon name={product.sections[0]?.icon ?? 'building'} size={24} />
              </span>
            }
          />
        )
      }
    />
  )
  // Порядок для всех товаров (решение владельца 26.10.2026): заголовок и коротко, лист с
  // картинками и тремя фактами, комплектация, вкладки «Обзор / Характеристики», вопросы;
  // у сканеров примеры сканов — в самом низу во всю ширину, карточка покупки липнет рядом с
  // содержимым и останавливается над сканами (без ухода в размытие).
  const tabs = [
    ...(about ? [{ id: 'overview' as const, title: 'Обзор', content: about }] : []),
    ...(specs
      ? [
          {
            id: 'specs' as const,
            title: 'Характеристики',
            count: product.properties.length,
            content: specs,
          },
        ]
      : []),
  ]
  const overview = (
    <>
      <CollectionContents product={product} />
      <ProductLifecycle value={product.lifecycle} />
      {tabs.length > 1 && (
        <Reveal>
          <ProductTabs label={`О товаре ${product.title}`} tabs={tabs} />
        </Reveal>
      )}
      {tabs.length === 1 && (
        <Reveal>
          <ProductSection
            title={about ? profile.about : profile.specs}
            id={about ? 'about' : 'specs'}
          >
            {about ?? specs}
          </ProductSection>
        </Reveal>
      )}
    </>
  )
  const config = (
    <ProductSection
      title={guided ? 'Подберите комплект' : profile.configTitle}
      id="config"
      sub={guided ? 'Отметьте нужное — итог пересчитается сразу.' : undefined}
    >
      <PickerSteps />
      <PickerHelp />
    </ProductSection>
  )
  const faq =
    product.faq.length > 0 ? (
      <Reveal>
        <ProductSection title="Частые вопросы" id="faq">
          <Faq items={product.faq} />
        </ProductSection>
      </Reveal>
    ) : null
  const scans =
    product.scans.length > 0 ? <ProductScans title={product.title} scans={product.scans} /> : null

  return (
    <main>
      <JsonLd data={structured} />
      <Container>
        <Breadcrumbs
          items={[
            { title: 'Каталог', href: catalogHref() },
            {
              title: groupLabels[product.kind],
              href: catalogHref({ group: groupKeys[product.kind] }),
            },
            ...(direction
              ? [{ title: direction.title, href: catalogHref({ direction: direction.slug }) }]
              : []),
            { title: product.title },
          ]}
        />
        <PickerProvider key={String(pick)} view={product.picker} meta={meta} pick={pick}>
          <ProductLayout asideLast header={header} aside={<PickerSummary />} wide={scans}>
            {config}
            {overview}
            {faq}
          </ProductLayout>
          <PickerBar />
        </PickerProvider>
        <ProductPicks
          panels={[
            {
              id: 'cross',
              title: 'С этим покупают',
              sub: 'Часто берут вместе с этим товаром.',
              items: toPicks(cross, byHref),
            },
            {
              id: 'similar',
              title: profile.similar,
              sub: 'Другие варианты под ту же задачу.',
              items: toPicks(similar, byHref),
            },
          ]}
        />
      </Container>
    </main>
  )
}
