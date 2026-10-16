import Image from 'next/image'
import type { Home } from '@/lib/home'
import bimImage from '../../../public/images/home/bim-model.webp'
import { Badge } from '../Badge/Badge'
import { ButtonLink } from '../Button/Button'
import { Container } from '../Container/Container'
import styles from './BimBand.module.css'

type Props = {
  bim: Home['bim']
  /** h1 — первый экран страницы «Внедрение BIM» (/bim), h2 — блок на главной. */
  level?: 1 | 2
  /** Вторая кнопка: на главной — «Подробнее о внедрении» на страницу /bim. */
  more?: { href: string; label: string }
  /** На странице /bim блок сразу под хлебными крошками — без верхнего отступа секции. */
  flush?: boolean
  /** Блок первым на экране (главная с 16.10.2026) — картинка грузится сразу, для LCP. */
  priority?: boolean
}

/** Тёмный блок «Внедрение BIM»: вводный текст, четыре этапа, кнопки и ключевые цифры. */
export function BimBand({ bim, level = 2, more, flush = false, priority = false }: Props) {
  if (!bim.title) return null
  const Heading = level === 1 ? 'h1' : 'h2'
  return (
    <section
      className={flush ? `${styles.section} ${styles.flush}` : styles.section}
      aria-labelledby="bim-title"
    >
      <Container>
        <div className={styles.band}>
          <Image
            src={bimImage}
            alt=""
            sizes="(min-width: 1200px) 720px, (min-width: 960px) 60vw, 100vw"
            className={styles.image}
            priority={priority}
          />
          {bim.eyebrow && <Badge tone="onDark">{bim.eyebrow}</Badge>}
          <Heading id="bim-title" className={styles.title}>
            {bim.title}
          </Heading>
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
            <div className={styles.buttons}>
              {bim.link && (
                <ButtonLink href={bim.link.href} variant="light">
                  {bim.link.label}
                </ButtonLink>
              )}
              {more && (
                <ButtonLink href={more.href} variant="ghostDark">
                  {more.label}
                </ButtonLink>
              )}
            </div>
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
