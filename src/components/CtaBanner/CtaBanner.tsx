import { Scale } from 'lucide-react'
import type { Home } from '@/lib/home'
import { ButtonLink } from '../Button/Button'
import { Container } from '../Container/Container'
import styles from './CtaBanner.module.css'

/**
 * Короткая голубая полоса с коммерческим обещанием («Нашли дешевле?»): заметный акцент
 * между крупными блоками, но не отдельная большая секция. Тексты — из CMS.
 */
export function CtaBanner({ cta }: { cta: Home['cta'] }) {
  if (!cta.title) return null
  return (
    <section className={styles.section} aria-labelledby="cta-title">
      <Container>
        <div className={styles.banner}>
          <span className={styles.icon}>
            <Scale size={24} strokeWidth={1.75} aria-hidden="true" />
          </span>
          <div className={styles.text}>
            <h2 id="cta-title" className={styles.title}>
              {cta.title}
            </h2>
            {cta.text && <p className={styles.lead}>{cta.text}</p>}
          </div>
          {cta.link && <ButtonLink href={cta.link.href}>{cta.link.label}</ButtonLink>}
        </div>
      </Container>
    </section>
  )
}
