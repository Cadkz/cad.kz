import type { Metadata } from 'next'
import { ContactsView } from '@/components/ContactsView/ContactsView'
import { getT } from '@/i18n/server'
import { getContacts } from '@/lib/navigation'
import { getPage } from '@/lib/pages'
import { ALL_LANGS, pageMetadata } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  const [page, t] = await Promise.all([getPage('contacts'), getT()])
  return pageMetadata({
    seo: page?.seo,
    title: t('Контакты — CAD.kz'),
    description: t('Телефоны, WhatsApp, почта и адрес офиса CAD.kz в Астане.'),
    path: '/contacts',
    langs: ALL_LANGS,
  })
}

/** Контакты из «Контакты и подвал»; вводный абзац и SEO — из «Страниц» (код contacts), если есть. */
export default async function ContactsPage() {
  const [contacts, page] = await Promise.all([getContacts(), getPage('contacts')])
  return <ContactsView contacts={contacts} lead={page?.lead ?? null} />
}
