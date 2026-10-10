import type { Home } from '@/lib/home'
import { BannerArt } from '../BannerArt/BannerArt'
import { ButtonLink } from '../Button/Button'
import { Container } from '../Container/Container'
import styles from './CtaBanner.module.css'

/** Тёмный баннер с призывом внизу страницы. Тексты — из CMS. */
export function CtaBanner({ cta }: { cta: Home['cta'] }) {
  if (!cta.title) return null
  return (
    <section className={styles.section} aria-labelledby="cta-title">
      <Container>
        <div className={styles.banner}>
          <div className={styles.text}>
            <h2 id="cta-title" className={styles.title}>
              {cta.title}
            </h2>
            {cta.text && <p className={styles.lead}>{cta.text}</p>}
          </div>
          <BannerArt name="compare" className={styles.art} onScroll />
          {cta.link && (
            <ButtonLink href={cta.link.href} variant="light">
              {cta.link.label}
            </ButtonLink>
          )}
        </div>
      </Container>
    </section>
  )
}
