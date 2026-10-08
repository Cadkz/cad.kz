import { ArrowLeft, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import styles from './PrevNext.module.css'

type LinkData = { title: string; href: string } | null

/** Переход к предыдущему и следующему материалу. */
export function PrevNext({ previous, next }: { previous: LinkData; next: LinkData }) {
  if (!previous && !next) return null
  return (
    <nav className={styles.nav} aria-label="Другие материалы">
      {previous ? (
        <Link href={previous.href} className={styles.link}>
          <span className={styles.label}>
            <ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" />
            Предыдущая
          </span>
          {previous.title}
        </Link>
      ) : (
        <span />
      )}
      {next && (
        <Link href={next.href} className={`${styles.link} ${styles.next}`}>
          <span className={styles.label}>
            Следующая
            <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />
          </span>
          {next.title}
        </Link>
      )}
    </nav>
  )
}
