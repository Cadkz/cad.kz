import Link from 'next/link'
import { organizationLd, websiteLd } from '@/domain/structuredData.mjs'
import { getContacts } from '@/lib/navigation'
import { siteUrl } from '@/lib/seo'
import { footerColumns } from '@/lib/siteNav'
import { ButtonLink } from '../Button/Button'
import { ContactList } from '../ContactList/ContactList'
import { Container } from '../Container/Container'
import { WhatsappIcon } from '../icons/icons'
import { JsonLd } from '../JsonLd/JsonLd'
import { Wordmark } from '../Wordmark/Wordmark'
import styles from './SiteFooter.module.css'

/** Логотип для поисковиков (карточка компании в выдаче). */
const LOGO = '/images/brand/cad-kz-logo.png'

/**
 * Общий подвал сайта (пробный редизайн 21.10.2026): тёмный лист во всю ширину со скруглённым
 * верхом — сверху призыв и связь, колонки ссылок и контакты, внизу огромная надпись cad.kz,
 * буквы которой поднимаются, когда подвал входит в экран (Wordmark). Здесь же разметка
 * компании и сайта для поисковиков — из тех же контактов, что в подвале.
 */
export async function SiteFooter() {
  const contacts = await getContacts()
  const year = new Date().getFullYear()
  const base = siteUrl()
  const phone = contacts.phones[0]
  return (
    <footer className={styles.footer}>
      <JsonLd
        data={organizationLd({
          base,
          name: 'CAD.kz',
          logo: LOGO,
          description: contacts.footerText,
          contacts,
        })}
      />
      <JsonLd data={websiteLd({ base, name: 'CAD.kz' })} />
      <Container>
        <div className={styles.lead}>
          <p className={styles.statement}>
            Подберём программы и оборудование под вашу задачу — и поможем внедрить.
          </p>
          <div className={styles.actions}>
            {contacts.whatsappHref && (
              <ButtonLink href={contacts.whatsappHref} variant="light" external>
                <WhatsappIcon size={20} />
                Написать в WhatsApp
              </ButtonLink>
            )}
            {phone && (
              <a href={`tel:${phone.tel}`} className={styles.phone}>
                {phone.label}
              </a>
            )}
          </div>
        </div>
        <div className={styles.grid}>
          <div className={styles.brand}>
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
            <ContactList contacts={contacts} whatsapp={false} tone="dark" />
          </div>
        </div>
        <Wordmark />
        <div className={styles.bottom}>
          <span>CAD.kz © {year}. Все права защищены.</span>
          <span>Демонстрационная версия: заявки и оплата не подключены.</span>
        </div>
      </Container>
    </footer>
  )
}
