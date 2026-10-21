import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs'
import { CheckoutView } from '@/components/CheckoutView/CheckoutView'
import { Container } from '@/components/Container/Container'
import { PageIntro } from '@/components/PageIntro/PageIntro'
import { crmLive } from '@/lib/crm/gateway'
import { getContacts } from '@/lib/navigation'

export const metadata = {
  title: 'Оформление заказа — CAD.kz',
  robots: { index: false, follow: false },
}

export default async function CheckoutPage() {
  const contacts = await getContacts()
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
          lead="Проверьте состав и оставьте имя и телефон — менеджер подтвердит цену и наличие и свяжется с вами."
        />
        <CheckoutView whatsappHref={contacts.whatsappHref} crmLive={crmLive()} />
      </Container>
    </main>
  )
}
