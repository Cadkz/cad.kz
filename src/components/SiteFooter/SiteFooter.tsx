import Link from 'next/link'
import { organizationLd, websiteLd } from '@/domain/structuredData.mjs'
import { getContacts } from '@/lib/navigation'
import { isProduction, siteUrl } from '@/lib/seo'
import { footerColumns } from '@/lib/siteNav'
import { Container } from '../Container/Container'
import { FooterContacts } from '../FooterContacts/FooterContacts'
import { JsonLd } from '../JsonLd/JsonLd'
import { Wordmark } from '../Wordmark/Wordmark'
import styles from './SiteFooter.module.css'

/** Логотип для поисковиков (карточка компании в выдаче). */
const LOGO = '/images/brand/cad-kz-logo.png'

/**
 * Общий подвал сайта: на всех страницах одинаковый. Тёмный лист во всю ширину экрана со
 * скруглённым верхом (21.10.2026, вид из пробной ветки redesign/home-motion): описание
 * компании, «Покупателям», «Компания» и контакты (аудит 21.10.2026, пакет 3), внизу надпись
 * cad.kz, буквы которой поднимаются при прокрутке (Wordmark). На телефоне описание скрыто,
 * ссылки в две колонки. Здесь же разметка компании и сайта для поисковиков — из тех же
 * контактов, что в подвале.
 */
export async function SiteFooter() {
  const contacts = await getContacts()
  const year = new Date().getFullYear()
  const base = siteUrl()
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
        <div className={styles.grid}>
          {contacts.footerText && (
            <div className={styles.brand}>
              <p className={styles.text}>{contacts.footerText}</p>
            </div>
          )}
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
          <div className={styles.contacts}>
            <p className={styles.title}>Контакты</p>
            <FooterContacts contacts={contacts} />
          </div>
        </div>
        <div className={styles.end}>
          <div className={styles.word}>
            <Wordmark />
          </div>
          <div className={styles.bottom}>
            <span>CAD.kz © {year}. Все права защищены.</span>
            {!isProduction() && <span>Тестовая версия сайта</span>}
          </div>
        </div>
      </Container>
    </footer>
  )
}
