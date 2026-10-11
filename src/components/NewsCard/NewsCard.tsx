import { Newspaper } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '../Badge/Badge'
import styles from './NewsCard.module.css'

export type NewsCardData = {
  id: number
  href: string
  title: string
  date: string | null
  topic: string | null
  excerpt: string | null
  cover: { url: string; alt: string; width: number; height: number } | null
}

type Props = {
  news: NewsCardData
  /** Фон обложки, если картинки нет: чередуется в сетке. */
  tone?: 'navy' | 'graphite' | 'deep'
  /** Показывать анонс: в списке новостей да, на главной — только дата и заголовок. */
  withExcerpt?: boolean
  /** Уровень заголовка: h2 в списке под h1 страницы, h3 в секции главной под её h2. */
  level?: 2 | 3
}

/** Карточка новости или статьи: обложка, дата, тематика, заголовок, анонс. */
export function NewsCard({ news, tone = 'navy', withExcerpt = false, level = 3 }: Props) {
  const Heading = level === 2 ? 'h2' : 'h3'
  return (
    <article className={styles.card}>
      <div className={`${styles.thumb} ${styles[tone]}`}>
        {news.cover ? (
          <Image
            src={news.cover.url}
            alt={news.cover.alt}
            fill
            sizes="(min-width: 960px) 384px, (min-width: 640px) 50vw, 100vw"
            className={styles.image}
          />
        ) : (
          <Newspaper size={24} strokeWidth={1.75} aria-hidden="true" />
        )}
      </div>
      <div className={styles.body}>
        <div className={styles.meta}>
          {news.date && <time dateTime={news.date}>{news.date}</time>}
          {news.topic && <Badge>{news.topic}</Badge>}
        </div>
        <Heading className={styles.title}>
          <Link href={news.href} className={styles.link}>
            {news.title}
          </Link>
        </Heading>
        {withExcerpt && news.excerpt && <p className={styles.excerpt}>{news.excerpt}</p>}
      </div>
    </article>
  )
}
