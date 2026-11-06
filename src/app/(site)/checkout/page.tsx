import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs'
import { CheckoutView } from '@/components/CheckoutView/CheckoutView'
import { Container } from '@/components/Container/Container'
import { PageIntro } from '@/components/PageIntro/PageIntro'
import { getT } from '@/i18n/server'
import { crmLive } from '@/lib/crm/gateway'
import { getContacts } from '@/lib/navigation'

export async function generateMetadata() {
  const t = await getT()
  return { title: t('Оформление заказа — CAD.kz'), robots: { index: false, follow: false } }
}

export default async function CheckoutPage() {
  const t = await getT()
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
          title={t('Оформление заказа')}
          lead={t(
            'Проверьте состав и оставьте имя и телефон — менеджер подтвердит цену и пришлёт счёт.',
          )}
        />
        <CheckoutView whatsappHref={contacts.whatsappHref} crmLive={crmLive()} />
      </Container>
    </main>
  )
}
