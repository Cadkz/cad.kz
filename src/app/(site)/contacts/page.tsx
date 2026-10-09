import type { Metadata } from 'next'
import { ContactsView } from '@/components/ContactsView/ContactsView'
import { getContacts } from '@/lib/navigation'
import { getPage } from '@/lib/pages'
import { pageMetadata } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage('contacts')
  return pageMetadata({
    seo: page?.seo,
    title: 'Контакты — CAD.kz',
    description: 'Телефоны, WhatsApp, почта и адрес офиса CAD.kz в Астане.',
    path: '/contacts',
  })
}

/** Контакты из «Контакты и подвал»; вводный абзац и SEO — из «Страниц» (код contacts), если есть. */
export default async function ContactsPage() {
  const [contacts, page] = await Promise.all([getContacts(), getPage('contacts')])
  return <ContactsView contacts={contacts} lead={page?.lead ?? null} />
}
