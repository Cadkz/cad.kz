import { ArrowLeft, ArrowRight } from 'lucide-react'
import Link from '@/components/LangLink/LangLink'
import { NAV_BACK, NAV_FORWARD } from '@/domain/motion.mjs'
import { getT } from '@/i18n/server'
import styles from './PrevNext.module.css'

type LinkData = { title: string; href: string } | null

/**
 * Листание материалов: «Предыдущая» и «Следующая» (правка владельца 02.11.2026, вечер).
 * Выглядят как навигация — стрелка в кружке, при наведении синий контур и стрелка сдвигается;
 * новая статья приходит с той стороны, куда листают.
 */
export async function PrevNext({ previous, next }: { previous: LinkData; next: LinkData }) {
  const t = await getT()
  if (!previous && !next) return null
  return (
    <nav className={styles.nav} aria-label={t('Другие материалы')}>
      {previous ? (
        <Link
          href={previous.href}
          className={`${styles.link} ${styles.prev}`}
          transitionTypes={NAV_BACK}
        >
          <span className={styles.arrow} aria-hidden="true">
            <ArrowLeft size={20} strokeWidth={1.75} />
          </span>
          <span className={styles.text}>
            <span className={styles.label}>{t('Предыдущая')}</span>
            <span className={styles.title}>{previous.title}</span>
          </span>
        </Link>
      ) : (
        <span />
      )}
      {next && (
        <Link
          href={next.href}
          className={`${styles.link} ${styles.next}`}
          transitionTypes={NAV_FORWARD}
        >
          <span className={styles.text}>
            <span className={styles.label}>{t('Следующая')}</span>
            <span className={styles.title}>{next.title}</span>
          </span>
          <span className={styles.arrow} aria-hidden="true">
            <ArrowRight size={20} strokeWidth={1.75} />
          </span>
        </Link>
      )}
    </nav>
  )
}
