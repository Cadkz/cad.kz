import type { Home } from '@/lib/home'
import { Aurora } from '../Aurora/Aurora'
import { BannerArt } from '../BannerArt/BannerArt'
import { ButtonLink } from '../Button/Button'
import { Container } from '../Container/Container'
import { Mascot } from '../Mascot/Mascot'
import styles from './CtaBanner.module.css'

/**
 * Тёмный баннер с призывом внизу страницы. Тексты — из CMS. Мелкий Юки с лупой сидит на нижнем
 * крае баннера между чертежом двух КП и кнопкой: «сравним цену». Последний акцент страницы:
 * внутри переливается сияние, свечения вокруг баннера нет.
 */
export function CtaBanner({ cta }: { cta: Home['cta'] }) {
  if (!cta.title) return null
  return (
    <section className={styles.section} aria-labelledby="cta-title">
      <Container>
        <div className={styles.frame}>
          <div className={styles.banner}>
            <Aurora />
            <div className={styles.text}>
              <h2 id="cta-title" className={styles.title}>
                {cta.title}
              </h2>
              {cta.text && <p className={styles.lead}>{cta.text}</p>}
            </div>
            <BannerArt name="compare" className={styles.art} onScroll />
            <Mascot pose="search" size="xs" className={styles.yuki} />
            {cta.link && (
              <ButtonLink href={cta.link.href} variant="light">
                {cta.link.label}
              </ButtonLink>
            )}
          </div>
        </div>
      </Container>
    </section>
  )
}
