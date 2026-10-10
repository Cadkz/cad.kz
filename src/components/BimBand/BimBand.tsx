import type { Home } from '@/lib/home'
import { Badge } from '../Badge/Badge'
import { BannerArt } from '../BannerArt/BannerArt'
import { ButtonLink } from '../Button/Button'
import { Container } from '../Container/Container'
import styles from './BimBand.module.css'

/** Тёмный блок «Внедрение BIM»: вводный текст, четыре этапа, кнопка и ключевые цифры. */
export function BimBand({ bim }: { bim: Home['bim'] }) {
  if (!bim.title) return null
  return (
    <section className={styles.section} aria-labelledby="bim-title">
      <Container>
        <div className={styles.band}>
          <BannerArt name="layers" className={styles.art} onScroll />
          {bim.eyebrow && <Badge tone="onDark">{bim.eyebrow}</Badge>}
          <h2 id="bim-title" className={styles.title}>
            {bim.title}
          </h2>
          {bim.lead && <p className={styles.lead}>{bim.lead}</p>}
          {bim.stages.length > 0 && (
            <ol className={styles.stages}>
              {bim.stages.map((stage, i) => (
                <li key={stage.title} className={styles.stage}>
                  <span className={styles.num}>{String(i + 1).padStart(2, '0')}</span>
                  <h3 className={styles.stageTitle}>{stage.title}</h3>
                  {stage.text && <p className={styles.stageText}>{stage.text}</p>}
                </li>
              ))}
            </ol>
          )}
          <div className={styles.bottom}>
            {bim.link && (
              <ButtonLink href={bim.link.href} variant="light">
                {bim.link.label}
              </ButtonLink>
            )}
            {bim.stats.length > 0 && (
              <dl className={styles.stats}>
                {bim.stats.map((stat) => (
                  <div key={stat.label} className={styles.stat}>
                    <dt className={styles.statLabel}>{stat.label}</dt>
                    <dd className={styles.statValue}>{stat.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>
      </Container>
    </section>
  )
}
