import Link from 'next/link'
import styles from './TopicLinks.module.css'

type Topic = { slug: string; title: string }
type Props = { topics: Topic[]; active: string | null; hrefFor: (slug: string | null) => string }

/** Фильтр по теме ссылками (?topic=адрес темы): работает без JavaScript, адрес можно отправить. */
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
