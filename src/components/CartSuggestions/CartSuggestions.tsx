import { Grid } from '../Grid/Grid'
import { ProductLinkCard } from '../ProductLinkCard/ProductLinkCard'
import { ProductSection } from '../ProductSection/ProductSection'

export type Suggestion = { href: string; title: string; vendor: string | null }

/** «С этим покупают» в корзине: подборку по всем товарам корзины считает сервер. */
export function CartSuggestions({ items }: { items: Suggestion[] }) {
  if (!items.length) return null
  return (
    <ProductSection title="С этим покупают" standalone>
      <Grid as="ul" span={{ base: 12, sm: 6, md: 4 }}>
        {items.map((item) => (
          <li key={item.href}>
            <ProductLinkCard href={item.href} title={item.title} vendor={item.vendor} />
          </li>
        ))}
      </Grid>
    </ProductSection>
  )
}
