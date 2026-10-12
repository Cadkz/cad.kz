import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs'
import { Container } from '@/components/Container/Container'
import { Faq } from '@/components/Faq/Faq'
import { PickerBar } from '@/components/PickerBar/PickerBar'
import { PickerHelp } from '@/components/PickerHelp/PickerHelp'
import { PickerProvider } from '@/components/PickerProvider/PickerProvider'
import { PickerSteps } from '@/components/PickerSteps/PickerSteps'
import { PickerSummary } from '@/components/PickerSummary/PickerSummary'
import { ProductAbout } from '@/components/ProductAbout/ProductAbout'
import { ProductGallery } from '@/components/ProductGallery/ProductGallery'
import { ProductHeader } from '@/components/ProductHeader/ProductHeader'
import { ProductLayout } from '@/components/ProductLayout/ProductLayout'
import { ProductPicks } from '@/components/ProductPicks/ProductPicks'
import { ProductSection } from '@/components/ProductSection/ProductSection'
import { PropertyList } from '@/components/PropertyList/PropertyList'
import { Reveal } from '@/components/Reveal/Reveal'
import { kindProfile } from '@/domain/productKind.mjs'
import { getCatalog } from '@/lib/catalog'
import { getContacts } from '@/lib/navigation'
import { catalogHref } from '@/lib/navigationHrefs'
import { cms } from '@/lib/payload'
import type { PickTarget, ProductPage, RelatedProduct } from '@/lib/product'
import { getRecommendations } from '@/lib/recommendations'
import { parseBody } from '@/lib/richText'
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
 * зависят от типа (src/domain/productKind.mjs). Первый экран: название, коротко,
 * задачи; справа итог выбора с тремя действиями. Ниже подбор по шагам (у обычной страницы —
 * один шаг из комплектаций), описание (начало сразу, остальное свёрнуто), характеристики, вопросы.
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
      hours: contacts.hours,
    },
  }

  return (
    <main>
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
        <PickerProvider view={product.picker} meta={meta} pick={pick}>
          <ProductLayout
            asideLast
            header={
              <ProductHeader
                title={product.title}
                vendor={product.vendor}
                summary={product.summary}
                icon={product.pictures.length ? null : (product.sections[0]?.icon ?? 'building')}
                tasks={product.tasks}
                requires={product.requires.map((r) => r.title)}
              />
            }
            aside={<PickerSummary />}
          >
            <ProductSection
              title={guided ? 'Подберите комплект' : profile.configTitle}
              id="config"
              sub={guided ? 'Отметьте нужное — итог пересчитается сразу.' : undefined}
            >
              <PickerSteps />
              <PickerHelp />
            </ProductSection>
            {product.pictures.length > 0 && (
              <ProductGallery pictures={product.pictures} title={product.title} />
            )}
            {product.description && (
              <Reveal>
                <ProductSection title={profile.about} id="about">
                  <ProductAbout blocks={parseBody(product.description)} />
                </ProductSection>
              </Reveal>
            )}
            {product.properties.length > 0 && (
              <Reveal>
                <ProductSection title={profile.specs} id="specs">
                  <PropertyList items={product.properties} />
                </ProductSection>
              </Reveal>
            )}
            {product.faq.length > 0 && (
              <Reveal>
                <ProductSection title="Частые вопросы" id="faq">
                  <Faq items={product.faq} />
                </ProductSection>
              </Reveal>
            )}
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
