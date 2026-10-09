import { ArrowRight, Clock, MapPin } from 'lucide-react'
import Link from 'next/link'
import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs'
import { ContactList } from '@/components/ContactList/ContactList'
import { Container } from '@/components/Container/Container'
import { Grid } from '@/components/Grid/Grid'
import { PageIntro } from '@/components/PageIntro/PageIntro'
import type { Contacts } from '@/lib/navigation'
import styles from './ContactsView.module.css'

type Props = { contacts: Contacts; lead: string | null }

/** «Контакты» — шаблон «Витрина»: связь, офис и реквизиты карточками. Всё из настроек CMS. */
export function ContactsView({ contacts, lead }: Props) {
  return (
    <main>
      <Container>
        <Breadcrumbs items={[{ title: 'Главная', href: '/' }, { title: 'Контакты' }]} />
        <PageIntro
          title="Контакты"
          lead={lead ?? 'Позвоните или напишите — подберём программы, оборудование и обучение.'}
        />
        <Grid span={{ base: 12, md: 4 }}>
          <section className={styles.card}>
            <h2 className={styles.title}>Позвонить или написать</h2>
            <ContactList contacts={contacts} />
          </section>
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
            {contacts.mapUrl && (
              <a href={contacts.mapUrl} className={styles.more} target="_blank" rel="noopener">
                Открыть на карте
                <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />
              </a>
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
