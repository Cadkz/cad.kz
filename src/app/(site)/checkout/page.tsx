import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs'
import { CheckoutView } from '@/components/CheckoutView/CheckoutView'
import { Container } from '@/components/Container/Container'
import { PageIntro } from '@/components/PageIntro/PageIntro'

export const metadata = { title: 'Оформление заказа — CAD.kz' }

export default function CheckoutPage() {
  return (
    <main>
      <Container>
        <Breadcrumbs
          items={[
            { title: 'Главная', href: '/' },
            { title: 'Корзина', href: '/cart' },
            { title: 'Оформление заказа' },
          ]}
        />
        <PageIntro
          title="Оформление заказа"
          lead="Состав заказа и контакты для заявки. Сумму перед сохранением ещё раз проверит сервер."
        />
        <CheckoutView />
      </Container>
    </main>
  )
}
