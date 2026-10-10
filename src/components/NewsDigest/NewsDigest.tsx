import { NewsCard, type NewsCardData } from '../NewsCard/NewsCard'
import { Reveal } from '../Reveal/Reveal'
import styles from './NewsDigest.module.css'

const tones = ['navy', 'graphite', 'deep'] as const

/**
 * Новости на главной: первая — крупной карточкой с анонсом, остальные — компактными
 * строками справа. Не ещё одна сетка одинаковых карточек после каталога.
 */
export function NewsDigest({ items }: { items: NewsCardData[] }) {
  const [main, ...rest] = items
  if (!main) return null
  return (
    <div className={styles.digest}>
      <Reveal className={styles.main}>
        <NewsCard news={main} tone="navy" withExcerpt />
      </Reveal>
      {rest.length > 0 && (
        <ul className={styles.rest}>
          {rest.map((item, i) => (
            <Reveal as="li" key={item.id} step={i + 1} className={styles.item}>
              <NewsCard news={item} tone={tones[(i + 1) % tones.length]} variant="compact" />
            </Reveal>
          ))}
        </ul>
      )}
    </div>
  )
}
