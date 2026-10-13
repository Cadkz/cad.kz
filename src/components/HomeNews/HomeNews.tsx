import type { Slide } from '@/lib/home'
import { type TopicCovers, toCard } from '@/lib/publications'
import type { Publication } from '../../../payload-types'
import { HeroSlider } from '../HeroSlider/HeroSlider'
import { NewsCard } from '../NewsCard/NewsCard'
import { Reveal } from '../Reveal/Reveal'
import { Section } from '../Section/Section'
import styles from './HomeNews.module.css'

type Props = { slides: Slide[]; news: Publication[]; covers: TopicCovers }

/**
 * «Новости и акции» на главной (замечание владельца 13.10.2026, вечер): слева баннер-слайдер
 * действующих акций и предложений, справа две последние новости. Отдельного блока акций
 * на главной больше нет (все акции — в слайдере и на /news?kind=promotion). Действующих акций
 * нет — слева крупно самая свежая новость.
 */
export function HomeNews({ slides, news, covers }: Props) {
  const feature = slides.length ? null : (news[0] ?? null)
  const side = (feature ? news.slice(1) : news).slice(0, 2)
  if (!slides.length && !feature) return null
  return (
    <Section id="news" title="Новости и акции" action={{ href: '/news', label: 'Все новости' }}>
      <ul className={styles.grid}>
        <Reveal as="li" className={styles.main}>
          {feature ? (
            <NewsCard news={toCard(feature, covers)} size="large" withExcerpt />
          ) : (
            <HeroSlider slides={slides} />
          )}
        </Reveal>
        {side.map((item, i) => (
          <Reveal as="li" key={item.id} step={i + 1} className={styles.side}>
            <NewsCard news={toCard(item, covers)} tone={i ? 'deep' : 'graphite'} />
          </Reveal>
        ))}
      </ul>
    </Section>
  )
}
