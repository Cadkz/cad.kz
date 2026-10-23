import type { Slide } from '@/lib/home'
import { type TopicCovers, toCard } from '@/lib/publications'
import type { Publication } from '../../../payload-types'
import { HeroSlider } from '../HeroSlider/HeroSlider'
import { NewsCard } from '../NewsCard/NewsCard'
import { Section } from '../Section/Section'
import styles from './HomeNews.module.css'

type Props = { slides: Slide[]; news: Publication[]; covers: TopicCovers }

/**
 * «Новости и акции» на главной (замечание владельца 13.10.2026, вечер): слева баннер-слайдер
 * действующих акций и предложений не выше 16:9 (замечание 16.10.2026: был «гигантский квадрат»),
 * справа три последние новости текстом, без картинок, ровно на высоту слайдера. Отдельного блока акций
 * на главной больше нет (все акции — в слайдере и на /news?kind=promotion). Действующих акций
 * нет — слева крупно самая свежая новость.
 */
export function HomeNews({ slides, news, covers }: Props) {
  const feature = slides.length ? null : (news[0] ?? null)
  const side = (feature ? news.slice(1) : news).slice(0, 3)
  if (!slides.length && !feature) return null
  return (
    <Section
      id="news"
      title="Новости и акции"
      action={{ href: '/news', label: 'Все новости' }}
      still
    >
      <ul className={styles.grid}>
        <li className={styles.main}>
          {feature ? (
            <NewsCard news={toCard(feature, covers)} size="large" withExcerpt />
          ) : (
            <HeroSlider slides={slides} />
          )}
        </li>
        {side.length > 0 && (
          <li className={styles.side}>
            <ul className={styles.list}>
              {side.map((item) => (
                <li key={item.id} className={styles.item}>
                  <NewsCard news={toCard(item, covers)} size="text" />
                </li>
              ))}
            </ul>
          </li>
        )}
      </ul>
    </Section>
  )
}
