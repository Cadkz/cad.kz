import type { Home } from '@/lib/home'
import { ButtonLink } from '../Button/Button'
import { Col } from '../Grid/Grid'
import { HeroSlider } from '../HeroSlider/HeroSlider'
import { Section } from '../Section/Section'
import styles from './PromoBand.module.css'

/** Акции и предложения на главной: баннер акций из новостей и карточки из CMS («Главная»). */
export function PromoBand({ home }: { home: Home }) {
  if (!home.slides.length && !home.sideCards.length) return null
  return (
    <Section
      id="offers"
      title="Акции и предложения"
      action={{ href: '/news?kind=promotion', label: 'Все акции' }}
    >
      <div className={styles.columns}>
        {home.slides.length > 0 && (
          <Col span={{ base: 12, md: home.sideCards.length ? 8 : 12 }}>
            <HeroSlider slides={home.slides} />
          </Col>
        )}
        {home.sideCards.length > 0 && (
          <Col span={{ base: 12, md: home.slides.length ? 4 : 12 }} className={styles.side}>
            {home.sideCards.map((card) => (
              <article
                key={card.title}
                className={card.dark ? `${styles.card} ${styles.dark}` : styles.card}
              >
                <h3 className={styles.cardTitle}>{card.title}</h3>
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
        )}
      </div>
    </Section>
  )
}
