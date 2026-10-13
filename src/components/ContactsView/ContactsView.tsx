import { ArrowRight, Clock, MapPin } from 'lucide-react'
import Link from 'next/link'
import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs'
import { Container } from '@/components/Container/Container'
import { Grid } from '@/components/Grid/Grid'
import { mapLinks, OfficeMap } from '@/components/OfficeMap/OfficeMap'
import { PageIntro } from '@/components/PageIntro/PageIntro'
import type { Contacts } from '@/lib/navigation'
import styles from './ContactsView.module.css'

type Props = { contacts: Contacts; lead: string | null }

/**
 * «Контакты» — шаблон «Витрина»: мини-карта, офис со ссылками на 2ГИС и Google Карты, реквизиты.
 * Телефоны и мессенджеры — в шапке и подвале, отдельной карточки нет (решение владельца 13.10.2026).
 * Всё из настроек CMS.
 */
export function ContactsView({ contacts, lead }: Props) {
  const links = contacts.address ? mapLinks(contacts.address, contacts.mapUrl) : null
  return (
    <main>
      <Container>
        <Breadcrumbs items={[{ title: 'Главная', href: '/' }, { title: 'Контакты' }]} />
        <PageIntro
          title="Контакты"
          lead={lead ?? 'Позвоните или напишите — подберём программы, оборудование и обучение.'}
        />
        <Grid span={{ base: 12, md: 4 }}>
          {contacts.address && <OfficeMap address={contacts.address} />}
          <section className={styles.card}>
            <h2 className={styles.title}>Офис</h2>
            {contacts.address ? (
              <p className={styles.line}>
                <MapPin size={16} strokeWidth={1.75} aria-hidden="true" />
                <span className={styles.address}>{contacts.address}</span>
              </p>
            ) : (
              <p className={styles.muted}>Адрес уточняйте у менеджера.</p>
            )}
            {contacts.hours && (
              <p className={styles.line}>
                <Clock size={16} strokeWidth={1.75} aria-hidden="true" />
                {contacts.hours}
              </p>
            )}
            {links && (
              <div className={styles.maps}>
                <a href={links.twoGis} className={styles.mapLink} target="_blank" rel="noopener">
                  Открыть в 2ГИС
                  <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />
                </a>
                <a href={links.google} className={styles.mapLink} target="_blank" rel="noopener">
                  Открыть в Google Картах
                  <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />
                </a>
              </div>
            )}
          </section>
          <section className={styles.card}>
            <h2 className={styles.title}>Для бухгалтерии</h2>
            <p className={styles.muted}>
              Реквизиты для договора и счёта, документы для госзакупок — по запросу у менеджера.
            </p>
            <Link href="/about/requisites" className={styles.more}>
              Реквизиты компании
              <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />
            </Link>
          </section>
        </Grid>
      </Container>
    </main>
  )
}
