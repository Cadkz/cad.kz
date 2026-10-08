import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs'
import { CartView } from '@/components/CartView/CartView'
import { Container } from '@/components/Container/Container'
import { PageIntro } from '@/components/PageIntro/PageIntro'

export const metadata = { title: 'Корзина — CAD.kz' }

export default function CartPage() {
  return (
    <main>
      <Container>
        <Breadcrumbs items={[{ title: 'Главная', href: '/' }, { title: 'Корзина' }]} />
        <PageIntro title="Корзина" />
        <CartView />
      </Container>
    </main>
  )
}
