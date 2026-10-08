import type { Home } from '@/lib/home'
import { catalogHref } from '@/lib/navigationHrefs'
import { Badge } from '../Badge/Badge'
import { ButtonLink } from '../Button/Button'
import { Container } from '../Container/Container'
import { Col } from '../Grid/Grid'
import { HeroSlider } from '../HeroSlider/HeroSlider'
import styles from './Hero.module.css'

const quickLinks = [
  { label: 'Программное обеспечение', group: 'software' },
  { label: 'Оборудование', group: 'hardware' },
  { label: 'Обучение', group: 'service' },
]

/** Первый экран главной: плашка, быстрые ссылки, баннер акций, две карточки и h1. */
export function Hero({ home }: { home: Home }) {
  return (
    <section className={styles.hero}>
      <Container>
        <div className={styles.top}>
          {home.eyebrow && (
            <Badge tone="outline" dot>
              {home.eyebrow}
            </Badge>
          )}
          <nav className={styles.quick} aria-label="Быстрый переход в каталог">
            {quickLinks.map((link) => (
              <ButtonLink
                key={link.group}
                href={catalogHref({ group: link.group })}
                variant="secondary"
                size="sm"
              >
                {link.label}
              </ButtonLink>
            ))}
          </nav>
        </div>
        <div className={styles.columns}>
          <Col span={{ base: 12, md: 8 }}>
            <HeroSlider slides={home.slides} />
          </Col>
          <Col span={{ base: 12, md: 4 }} className={styles.side}>
            {home.sideCards.map((card) => (
              <article
                key={card.title}
                className={card.dark ? `${styles.card} ${styles.dark}` : styles.card}
              >
                <h2 className={styles.cardTitle}>{card.title}</h2>
                {card.text && <p className={styles.cardText}>{card.text}</p>}
                {card.link && (
                  <ButtonLink
                    href={card.link.href}
                    variant={card.dark ? 'ghostDark' : 'outline'}
                    size="sm"
                  >
                    {card.link.label}
                  </ButtonLink>
                )}
              </article>
            ))}
          </Col>
        </div>
        <div className={styles.sub}>
          <h1 className={styles.title}>{home.title}</h1>
          <ButtonLink href={catalogHref()}>Перейти в каталог</ButtonLink>
        </div>
      </Container>
    </section>
  )
}
