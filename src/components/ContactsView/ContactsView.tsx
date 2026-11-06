import { ArrowRight, Clock, MapPin } from 'lucide-react'
import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs'
import { Container } from '@/components/Container/Container'
import { Grid } from '@/components/Grid/Grid'
import Link from '@/components/LangLink/LangLink'
import { mapLinks, OfficeMap } from '@/components/OfficeMap/OfficeMap'
import { PageIntro } from '@/components/PageIntro/PageIntro'
import { getT } from '@/i18n/server'
import type { Contacts } from '@/lib/navigation'
import styles from './ContactsView.module.css'

type Props = { contacts: Contacts; lead: string | null }

/**
 * «Контакты» — шаблон «Витрина»: мини-карта, офис со ссылками на 2ГИС и Google Карты, реквизиты.
 * Телефоны и мессенджеры — в шапке и подвале, отдельной карточки нет (решение владельца 13.10.2026).
 * Всё из настроек CMS.
 */
export async function ContactsView({ contacts, lead }: Props) {
  const t = await getT()
  const links = contacts.address ? mapLinks(contacts.address, contacts.mapUrl) : null
  return (
    <main>
      <Container>
        <Breadcrumbs items={[{ title: 'Главная', href: '/' }, { title: 'Контакты' }]} />
        <PageIntro
          title={t('Контакты')}
          lead={lead ?? t('Позвоните или напишите — подберём программы, оборудование и обучение.')}
        />
        <Grid span={{ base: 12, md: 4 }}>
          {contacts.address && (
            <OfficeMap
              address={contacts.address}
              title={t('Офис CAD.kz на карте: {address}', { address: t(contacts.address) })}
            />
          )}
          <section className={styles.card}>
            <h2 className={styles.title}>{t('Офис')}</h2>
            {contacts.address ? (
              <p className={styles.line}>
                <MapPin size={16} strokeWidth={1.75} aria-hidden="true" />
                <span className={styles.address}>{t(contacts.address)}</span>
              </p>
            ) : (
              <p className={styles.muted}>{t('Адрес уточняйте у менеджера.')}</p>
            )}
            {contacts.hours && (
              <p className={styles.line}>
                <Clock size={16} strokeWidth={1.75} aria-hidden="true" />
                {t(contacts.hours)}
              </p>
            )}
            {links && (
              <div className={styles.maps}>
                <a href={links.twoGis} className={styles.mapLink} target="_blank" rel="noopener">
                  {t('Открыть в 2ГИС')}
                  <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />
                </a>
                <a href={links.google} className={styles.mapLink} target="_blank" rel="noopener">
                  {t('Открыть в Google Картах')}
                  <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />
                </a>
              </div>
            )}
          </section>
          <section className={styles.card}>
            <h2 className={styles.title}>{t('Для бухгалтерии')}</h2>
            <p className={styles.muted}>
              {t(
                'Реквизиты для договора и счёта, документы для госзакупок — по запросу у менеджера.',
              )}
            </p>
            <Link href="/about/requisites" className={styles.more}>
              {t('Реквизиты компании')}
              <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />
            </Link>
          </section>
        </Grid>
      </Container>
    </main>
  )
}
