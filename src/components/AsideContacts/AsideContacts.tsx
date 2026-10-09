import Link from 'next/link'
import type { Contacts } from '@/lib/navigation'
import { ContactList } from '../ContactList/ContactList'
import styles from './AsideContacts.module.css'

/** Контакты в правой колонке шаблона «Чтение» (страницы раздела «О компании»). */
export function AsideContacts({ contacts }: { contacts: Contacts }) {
  return (
    <section className={styles.box} aria-labelledby="aside-contacts-title">
      <h2 id="aside-contacts-title" className={styles.title}>
        Контакты
      </h2>
      <ContactList contacts={contacts} socials={false} />
      {contacts.address && <p className={styles.address}>{contacts.address}</p>}
      <Link href="/contacts" className={styles.link}>
        Все контакты и карта
      </Link>
    </section>
  )
}
