import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs'
import { CartView } from '@/components/CartView/CartView'
import { Container } from '@/components/Container/Container'
import { PageIntro } from '@/components/PageIntro/PageIntro'
import { getT } from '@/i18n/server'
import { crmLive } from '@/lib/crm/gateway'
import { getContacts } from '@/lib/navigation'

export async function generateMetadata() {
  const t = await getT()
  return { title: t('Корзина — CAD.kz'), robots: { index: false, follow: false } }
}

export default async function CartPage() {
  const t = await getT()
  const contacts = await getContacts()
  return (
    <main>
      <Container>
        <Breadcrumbs items={[{ title: 'Главная', href: '/' }, { title: 'Корзина' }]} />
        <PageIntro title={t('Корзина')} />
        <CartView whatsappHref={contacts.whatsappHref} crmLive={crmLive()} />
      </Container>
    </main>
  )
}
