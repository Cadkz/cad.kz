import Link from '@/components/LangLink/LangLink'
import { getT } from '@/i18n/server'
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
export async function TopicLinks({
  topics,
  active,
  hrefFor,
  label = 'Тема',
  allLabel = 'Все темы',
  min = 2,
}: Props) {
  const t = await getT()
  if (topics.length < min && !active) return null
  return (
    <nav aria-label={t(label)} className={styles.list}>
      <span className={styles.label}>{t(label)}</span>
      <Link
        href={hrefFor(null)}
        className={styles.chip}
        aria-current={active === null ? 'page' : undefined}
      >
        {t(allLabel)}
      </Link>
      {topics.map((topic) => (
        <Link
          key={topic.slug}
          href={hrefFor(topic.slug)}
          className={styles.chip}
          aria-current={active === topic.slug ? 'page' : undefined}
        >
          {t(topic.title)}
        </Link>
      ))}
    </nav>
  )
}
