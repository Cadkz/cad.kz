import { ArticleBody } from '@/components/ArticleBody/ArticleBody'
import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs'
import { BuyBox } from '@/components/BuyBox/BuyBox'
import { Configurator } from '@/components/Configurator/Configurator'
import { Container } from '@/components/Container/Container'
import { CtaBanner } from '@/components/CtaBanner/CtaBanner'
import { Faq } from '@/components/Faq/Faq'
import { Grid } from '@/components/Grid/Grid'
import { MobileBuyBar } from '@/components/MobileBuyBar/MobileBuyBar'
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
        {items.map((item) => (
          <li key={item.slug}>
            <ProductLinkCard href={item.href} title={item.title} vendor={item.vendor} />
          </li>
        ))}
      </Grid>
    </ProductSection>
  )
}

/** Страница товара — шаблон «Товар». Все данные и цены из CMS, итог считает сервер. */
export async function ProductView({ product }: { product: ProductPage }) {
  const [{ cross, similar }, contacts, home] = await Promise.all([
    cms().then((payload) => getRecommendations(payload, product.id)),
    getContacts(),
    getHome(),
  ])
  const direction = product.sections.find((s) => s.isDirection)
  const priceFrom = product.offers.find((o) => o.price)?.price ?? null
  const several = product.offers.length > 1

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
        <ProductLayout
          header={
            <ProductHeader
              title={product.title}
              vendor={product.vendor}
              summary={product.summary}
              icon={product.sections[0]?.icon ?? null}
              tasks={product.tasks}
              requires={product.requires.map((r) => r.title)}
            />
          }
          aside={
            <BuyBox
              priceFrom={priceFrom}
              several={several}
              whatsappHref={contacts.whatsappHref}
              productTitle={product.title}
            />
          }
        >
          {product.description && (
            <ProductSection title="О программе" id="about">
              <ArticleBody blocks={parseBody(product.description)} />
            </ProductSection>
          )}
          <ProductSection
            title="Комплектация и цена"
            id="config"
            sub="Выберите комплектацию и количество — итог с НДС пересчитывается на сервере по курсу и ставке из админки."
          >
            <Configurator offers={product.offers} productTitle={product.title} />
          </ProductSection>
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
        <Related title="С этим покупают" items={cross} />
        <Related title="Похожие товары" items={similar} />
      </Container>
      <CtaBanner cta={home.cta} />
      <MobileBuyBar priceFrom={priceFrom} several={several} />
    </main>
  )
}
