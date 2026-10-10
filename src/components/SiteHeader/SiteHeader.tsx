import { getContacts, getMenu } from '@/lib/navigation'
import { searchHints, typingHints } from '@/lib/siteNav'
import { CartButton } from '../CartButton/CartButton'
import { CatalogNav } from '../CatalogNav/CatalogNav'
import { ContactList } from '../ContactList/ContactList'
import { Container } from '../Container/Container'
import { HeaderAction } from '../HeaderAction/HeaderAction'
import { HeaderShell } from '../HeaderShell/HeaderShell'
import { WhatsappIcon } from '../icons/icons'
import { Logo } from '../Logo/Logo'
import { MobileMenu } from '../MobileMenu/MobileMenu'
import { SiteSearch } from '../SiteSearch/SiteSearch'
import { SubNav } from '../SubNav/SubNav'
import styles from './SiteHeader.module.css'

/**
 * Общая шапка сайта, ширина — рамка --container. Две строки (от 960 px):
 * 1) главное — логотип, «Каталог», широкий поиск, WhatsApp, корзина; закреплена при прокрутке;
 * 2) разделы сайта и телефон — тише и уезжает вместе со страницей.
 * Уже 960 px: меню, логотип, поиск, WhatsApp, корзина; разделы — в меню.
 */
export async function SiteHeader() {
  const [menu, contacts] = await Promise.all([getMenu(), getContacts()])
  const contactList = <ContactList contacts={contacts} socials={false} />
  return (
    <>
      <HeaderShell>
        <Container className={styles.bar}>
          <MobileMenu
            menu={menu}
            contacts={<ContactList contacts={contacts} socials={false} whatsapp={false} />}
            whatsappHref={contacts.whatsappHref}
          />
          <Logo priority />
          <CatalogNav menu={menu} whatsappHref={contacts.whatsappHref} />
          <SiteSearch
            hints={searchHints}
            typingHints={typingHints}
            whatsappHref={contacts.whatsappHref}
          />
          <div className={styles.actions}>
            {contacts.whatsappHref && (
              <HeaderAction
                href={contacts.whatsappHref}
                external
                tone="whatsapp"
                icon={<WhatsappIcon size={20} />}
                label="WhatsApp"
                ariaLabel="Написать в WhatsApp"
              />
            )}
            <CartButton />
          </div>
        </Container>
      </HeaderShell>
      <SubNav phone={contacts.phones[0] ?? null} contacts={contactList} />
    </>
  )
}
