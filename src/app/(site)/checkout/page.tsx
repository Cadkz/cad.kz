import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs'
import { CheckoutView } from '@/components/CheckoutView/CheckoutView'
import { Container } from '@/components/Container/Container'
import { PageIntro } from '@/components/PageIntro/PageIntro'
import { getContacts } from '@/lib/navigation'

export const metadata = {
  title: 'Оформление заявки — CAD.kz',
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
            { title: 'Оформление заявки' },
          ]}
        />
        <PageIntro
          title="Оформление заявки"
          lead="Проверьте состав и оставьте имя и телефон — менеджер подтвердит цену и наличие и свяжется с вами."
        />
        <CheckoutView whatsappHref={contacts.whatsappHref} />
      </Container>
    </main>
  )
}
