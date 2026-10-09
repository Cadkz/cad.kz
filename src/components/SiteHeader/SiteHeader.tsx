import Link from 'next/link'
import { getContacts, getMenu } from '@/lib/navigation'
import { catalogHref } from '@/lib/navigationHrefs'
import { CartButton } from '../CartButton/CartButton'
import { ContactList } from '../ContactList/ContactList'
import { Container } from '../Container/Container'
import { WhatsappIcon } from '../icons/icons'
import { Logo } from '../Logo/Logo'
import { MainNav } from '../MainNav/MainNav'
import { MobileMenu } from '../MobileMenu/MobileMenu'
import { SearchButton } from '../SearchButton/SearchButton'
import styles from './SiteHeader.module.css'

/** Общая шапка сайта. Единственная: подключается в layout, ширина — рамка --container. */
export async function SiteHeader() {
  const [menu, contacts] = await Promise.all([getMenu(), getContacts()])
  return (
    <header className={styles.header}>
      <Container className={styles.bar}>
        <Logo priority />
        <MainNav
          menu={menu}
          whatsappHref={contacts.whatsappHref}
          aboutExtra={<ContactList contacts={contacts} />}
        />
        <div className={styles.actions}>
          {contacts.phones.length > 0 && (
            <div className={styles.phones}>
              {contacts.phones.slice(0, 2).map((phone) => (
                <a key={phone.tel} href={`tel:${phone.tel}`} className={styles.phone}>
                  {phone.label}
                </a>
              ))}
            </div>
          )}
          {contacts.whatsappHref && (
            <a
              href={contacts.whatsappHref}
              className={styles.whatsapp}
              target="_blank"
              rel="noreferrer"
              aria-label="Написать в WhatsApp"
            >
              <WhatsappIcon size={20} />
            </a>
          )}
          <SearchButton />
          <CartButton />
          <Link href={catalogHref()} className={styles.cta}>
            Подобрать решение
          </Link>
          <MobileMenu menu={menu} contacts={<ContactList contacts={contacts} />} />
        </div>
      </Container>
    </header>
  )
}
