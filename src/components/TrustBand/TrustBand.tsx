import { ArrowRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import type { Home } from '@/lib/home'
import { Grid } from '../Grid/Grid'
import { Section } from '../Section/Section'
import styles from './TrustBand.module.css'

type Partner = Home['trust']['partners'][number]

function PartnerTile({ partner }: { partner: Partner }) {
  const body = (
    <>
      {partner.logo ? (
        <Image
          src={partner.logo.url}
          alt={partner.vendor}
          width={partner.logo.width}
          height={partner.logo.height}
          className={styles.logo}
        />
      ) : (
        <span className={styles.vendor}>{partner.vendor}</span>
      )}
      {partner.status && <span className={styles.status}>{partner.status}</span>}
      {partner.note && <span className={styles.note}>{partner.note}</span>}
    </>
  )
  if (!partner.href) return <div className={styles.tile}>{body}</div>
  return (
    <Link href={partner.href} className={`${styles.tile} ${styles.linked}`}>
      {body}
    </Link>
  )
}

/**
 * Блок доверия под первым экраном главной: заголовок и логотипы производителей (решение
 * владельца — коротко, без пояснений). Статус, подпись, подзаголовок и ссылки — только
 * если заполнены в CMS («Главная» → «Официальный партнёр»); нет партнёров — блока нет.
 */
export function TrustBand({ trust }: { trust: Home['trust'] }) {
  if (!trust.partners.length) return null
  return (
    <Section
      id="trust"
      title={trust.title || 'Официальный партнёр производителей'}
      sub={trust.lead ?? undefined}
    >
      <Grid as="ul" span={{ base: 6, sm: 4, md: 2 }}>
        {trust.partners.map((partner) => (
          <li key={partner.vendor}>
            <PartnerTile partner={partner} />
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
