import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs'
import { Container } from '@/components/Container/Container'
import { Faq } from '@/components/Faq/Faq'
import { Grid } from '@/components/Grid/Grid'
import { PickerBar } from '@/components/PickerBar/PickerBar'
import { PickerProvider } from '@/components/PickerProvider/PickerProvider'
import { PickerSteps } from '@/components/PickerSteps/PickerSteps'
import { PickerSummary } from '@/components/PickerSummary/PickerSummary'
import { ProductAbout } from '@/components/ProductAbout/ProductAbout'
import { ProductGallery } from '@/components/ProductGallery/ProductGallery'
import { ProductHeader } from '@/components/ProductHeader/ProductHeader'
import { ProductLayout } from '@/components/ProductLayout/ProductLayout'
import { ProductLinkCard } from '@/components/ProductLinkCard/ProductLinkCard'
import { ProductSection } from '@/components/ProductSection/ProductSection'
import { PropertyList } from '@/components/PropertyList/PropertyList'
import { Reveal } from '@/components/Reveal/Reveal'
import { kindProfile } from '@/domain/productKind.mjs'
import { getContacts } from '@/lib/navigation'
import { catalogHref } from '@/lib/navigationHrefs'
import { cms } from '@/lib/payload'
import type { ProductPage, RelatedProduct } from '@/lib/product'
import { getRecommendations } from '@/lib/recommendations'
import { parseBody } from '@/lib/richText'

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

function Related({ title, items }: { title: string; items: RelatedProduct[] }) {
  if (!items.length) return null
  return (
    <ProductSection title={title} standalone>
      <Grid as="ul" span={{ base: 12, sm: 6, md: 4 }}>
        {items.slice(0, 6).map((item, i) => (
          <Reveal as="li" key={item.slug} step={i}>
            <ProductLinkCard href={item.href} title={item.title} vendor={item.vendor} />
          </Reveal>
        ))}
      </Grid>
    </ProductSection>
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
  pick: number | null
}) {
  const [{ cross, similar }, contacts] = await Promise.all([
    cms().then((payload) => getRecommendations(payload, product.id)),
    getContacts(),
  ])
  const direction = product.sections.find((s) => s.isDirection)
  const guided = product.pageView === 'picker'
  const profile = kindProfile(product.kind)
  const meta = {
    productId: product.id,
    kind: product.kind,
    productTitle: product.title,
    renewLabel: product.renewLabel,
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
        <Related title="С этим покупают" items={cross} />
        <Related title={profile.similar} items={similar} />
      </Container>
    </main>
  )
}
