import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs'
import { CartView } from '@/components/CartView/CartView'
import { Container } from '@/components/Container/Container'
import { PageIntro } from '@/components/PageIntro/PageIntro'
import { getContacts } from '@/lib/navigation'

export const metadata = { title: 'Корзина — CAD.kz', robots: { index: false, follow: false } }

export default async function CartPage() {
  const contacts = await getContacts()
  return (
    <main>
      <Container>
        <Breadcrumbs items={[{ title: 'Главная', href: '/' }, { title: 'Корзина' }]} />
        <PageIntro title="Корзина" />
        <CartView whatsappHref={contacts.whatsappHref} />
      </Container>
    </main>
  )
}
