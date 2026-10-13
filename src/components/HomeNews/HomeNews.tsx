import { type TopicCovers, toCard } from '@/lib/publications'
import type { Publication } from '../../../payload-types'
import { NewsCard } from '../NewsCard/NewsCard'
import { Reveal } from '../Reveal/Reveal'
import { Section } from '../Section/Section'
import styles from './HomeNews.module.css'

type Props = { feature: Publication | null; news: Publication[]; covers: TopicCovers }

/**
 * «Статьи и новости» на главной (замечание владельца 13.10.2026): слева крупно последняя
 * статья, справа две последние новости. Статей нет — крупно самая свежая новость.
 */
export function HomeNews({ feature, news, covers }: Props) {
  const main = feature ?? news[0] ?? null
  const side = (feature ? news : news.slice(1)).slice(0, 2)
  if (!main) return null
  return (
    <Section id="news" title="Статьи и новости" action={{ href: '/news', label: 'Все материалы' }}>
      <ul className={styles.grid}>
        <Reveal as="li" className={styles.main}>
          <NewsCard news={toCard(main, covers)} size="large" withExcerpt />
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
