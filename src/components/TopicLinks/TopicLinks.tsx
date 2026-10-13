import Link from 'next/link'
import styles from './TopicLinks.module.css'

type Topic = { slug: string; title: string }
type Props = {
  topics: Topic[]
  active: string | null
  hrefFor: (slug: string | null) => string
  /** Подпись ряда (видна слева): «Тема», «Производитель». */
  label?: string
  allLabel?: string
  /** Сколько вариантов нужно, чтобы показать ряд: тем — от двух, производителей — от одного. */
  min?: number
}

/**
 * Фильтр ссылками (?topic=…, ?vendor=…): работает без JavaScript, адрес можно отправить.
 * Ряды тем и производителей на страницах новостей, статей и акций.
 */
export function TopicLinks({
  topics,
  active,
  hrefFor,
  label = 'Тема',
  allLabel = 'Все темы',
  min = 2,
}: Props) {
  if (topics.length < min && !active) return null
  return (
    <nav aria-label={label} className={styles.list}>
      <span className={styles.label}>{label}</span>
      <Link
        href={hrefFor(null)}
        className={styles.chip}
        aria-current={active === null ? 'page' : undefined}
      >
        {allLabel}
      </Link>
      {topics.map((topic) => (
        <Link
          key={topic.slug}
          href={hrefFor(topic.slug)}
          className={styles.chip}
          aria-current={active === topic.slug ? 'page' : undefined}
        >
          {topic.title}
        </Link>
      ))}
    </nav>
  )
}
