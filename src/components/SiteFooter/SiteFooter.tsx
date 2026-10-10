import Link from 'next/link'
import { getContacts } from '@/lib/navigation'
import { footerColumns } from '@/lib/siteNav'
import { ContactList } from '../ContactList/ContactList'
import { Container } from '../Container/Container'
import { Logo } from '../Logo/Logo'
import styles from './SiteFooter.module.css'

/** Общий подвал сайта: тёмный во всю ширину экрана, содержимое в рамке сайта. */
export async function SiteFooter() {
  const contacts = await getContacts()
  const year = new Date().getFullYear()
  return (
    <footer className={styles.footer}>
      <Container>
        <div className={styles.card}>
          <div className={styles.brand}>
            <span className={styles.logo}>
              <Logo />
            </span>
            {contacts.footerText && <p className={styles.text}>{contacts.footerText}</p>}
          </div>
          {footerColumns.map((column) => (
            <nav key={column.title} className={styles.column} aria-label={column.title}>
              <p className={styles.title}>{column.title}</p>
              {column.links.map((link) =>
                link.href.startsWith('http') ? (
                  <a key={link.href} href={link.href} className={styles.link}>
                    {link.title}
                  </a>
                ) : (
                  <Link key={link.href} href={link.href} className={styles.link}>
                    {link.title}
                  </Link>
                ),
              )}
            </nav>
          ))}
          <div className={styles.column}>
            <p className={styles.title}>Контакты</p>
            <ContactList contacts={contacts} onDark />
          </div>
        </div>
        <div className={styles.bottom}>
          <span>CAD.kz © {year}. Все права защищены.</span>
          <span>Демонстрационная версия: заявки и оплата не подключены.</span>
        </div>
      </Container>
    </footer>
  )
}
