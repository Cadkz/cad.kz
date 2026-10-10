import { ArrowRight, BadgeCheck } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import type { Home } from '@/lib/home'
import { Grid } from '../Grid/Grid'
import { Section } from '../Section/Section'
import styles from './TrustBand.module.css'

type Partner = Home['trust']['partners'][number]

function PartnerCard({ partner }: { partner: Partner }) {
  const body = (
    <>
      <div className={styles.brand}>
        {partner.logo ? (
          <Image
            src={partner.logo.url}
            alt={partner.logo.alt}
            width={partner.logo.width}
            height={partner.logo.height}
            className={styles.logo}
          />
        ) : (
          <span className={styles.vendor}>{partner.vendor}</span>
        )}
        <BadgeCheck size={20} strokeWidth={1.75} aria-hidden="true" className={styles.check} />
      </div>
      <p className={styles.status}>{partner.status}</p>
      {partner.note && <p className={styles.note}>{partner.note}</p>}
    </>
  )
  if (!partner.href) return <div className={styles.card}>{body}</div>
  return (
    <Link href={partner.href} className={`${styles.card} ${styles.linked}`}>
      {body}
    </Link>
  )
}

/**
 * Блок доверия под первым экраном главной: статусы у производителей и ссылки на реквизиты
 * и гарантии. Всё из CMS («Главная» → «Официальный партнёр»); нет партнёров — блока нет.
 */
export function TrustBand({ trust }: { trust: Home['trust'] }) {
  if (!trust.partners.length) return null
  return (
    <Section
      id="trust"
      title={trust.title || 'Официальный партнёр производителей'}
      sub={trust.lead ?? undefined}
    >
      <Grid as="ul" span={{ base: 12, sm: 6, md: 3 }}>
        {trust.partners.map((partner) => (
          <li key={`${partner.vendor}-${partner.status}`}>
            <PartnerCard partner={partner} />
          </li>
        ))}
      </Grid>
      {trust.links.length > 0 && (
        <ul className={styles.links}>
          {trust.links.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className={styles.link}>
                {link.label}
                <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Section>
  )
}
