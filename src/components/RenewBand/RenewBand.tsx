import { RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { RENEW_PROGRAMS } from '@/domain/siteRequest.mjs'
import { ButtonLink } from '../Button/Button'
import { Container } from '../Container/Container'
import styles from './RenewBand.module.css'

type Props = { title: string | null; text: string | null }

/**
 * Полоса «Продление лицензий» на главной: программы чипами ведут на страницу продления
 * с выбранной программой, кнопка — на страницу без выбора. Нет заголовка — полосы нет.
 */
export function RenewBand({ title, text }: Props) {
  if (!title) return null
  return (
    <section className={styles.band} aria-labelledby="renew-band-title">
      <Container>
        <div className={styles.box}>
          <span className={styles.icon} aria-hidden="true">
            <RefreshCw size={24} strokeWidth={1.75} />
          </span>
          <div className={styles.text}>
            <h2 id="renew-band-title" className={styles.title}>
              {title}
            </h2>
            {text && <p className={styles.lead}>{text}</p>}
            <ul className={styles.programs}>
              {RENEW_PROGRAMS.map((program) => (
                <li key={program}>
                  <Link
                    href={`/renew?program=${encodeURIComponent(program)}`}
                    className={styles.chip}
                  >
                    {program}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/renew?program=other" className={styles.chip}>
                  Другая программа
                </Link>
              </li>
            </ul>
          </div>
          <div className={styles.cta}>
            <ButtonLink href="/renew">Оформить продление</ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  )
}
