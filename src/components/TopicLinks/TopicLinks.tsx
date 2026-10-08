import Link from 'next/link'
import styles from './TopicLinks.module.css'

type Props = { topics: string[]; active: string | null; hrefFor: (topic: string | null) => string }

/** Фильтр по тематике ссылками: работает без JavaScript, адрес можно отправить. */
export function TopicLinks({ topics, active, hrefFor }: Props) {
  if (topics.length < 2) return null
  return (
    <nav aria-label="Тематики" className={styles.list}>
      <Link
        href={hrefFor(null)}
        className={styles.chip}
        aria-current={active === null ? 'page' : undefined}
      >
        Все темы
      </Link>
      {topics.map((topic) => (
        <Link
          key={topic}
          href={hrefFor(topic)}
          className={styles.chip}
          aria-current={active === topic ? 'page' : undefined}
        >
          {topic}
        </Link>
      ))}
    </nav>
  )
}
