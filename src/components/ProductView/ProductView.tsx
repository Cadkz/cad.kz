import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs'
import { Container } from '@/components/Container/Container'
import { CtaBanner } from '@/components/CtaBanner/CtaBanner'
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
import { getHome } from '@/lib/home'
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
        {items.slice(0, 6).map((item) => (
          <li key={item.slug}>
            <ProductLinkCard href={item.href} title={item.title} vendor={item.vendor} />
          </li>
        ))}
      </Grid>
    </ProductSection>
  )
}

/**
 * Страница товара — шаблон «Товар», один для всех товаров. Первый экран: название, коротко,
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
  const [{ cross, similar }, contacts, home] = await Promise.all([
    cms().then((payload) => getRecommendations(payload, product.id)),
    getContacts(),
    getHome(),
  ])
  const direction = product.sections.find((s) => s.isDirection)
  const guided = product.pageView === 'picker'
  const meta = {
    productId: product.id,
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
              title={guided ? 'Подберите комплект' : 'Комплектация и цена'}
              id="config"
              sub={guided ? 'Отметьте нужное — итог справа пересчитается сразу.' : undefined}
            >
              <PickerSteps />
            </ProductSection>
            {product.pictures.length > 0 && (
              <ProductGallery pictures={product.pictures} title={product.title} />
            )}
            {product.description && (
              <ProductSection title="О программе" id="about">
                <ProductAbout blocks={parseBody(product.description)} />
              </ProductSection>
            )}
            {product.properties.length > 0 && (
              <ProductSection title="Характеристики" id="specs">
                <PropertyList items={product.properties} />
              </ProductSection>
            )}
            {product.faq.length > 0 && (
              <ProductSection title="Частые вопросы" id="faq">
                <Faq items={product.faq} />
              </ProductSection>
            )}
          </ProductLayout>
          <PickerBar />
        </PickerProvider>
        <Related title="С этим покупают" items={cross} />
        <Related title="Похожие товары" items={similar} />
      </Container>
      <CtaBanner cta={home.cta} />
    </main>
  )
}
